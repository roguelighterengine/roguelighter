<script lang="ts">
  import CodeEditor from './ide/CodeEditor.svelte';
  import SceneEditor from './editor/SceneEditor.svelte';
  import Game from './game/Game.svelte';
  import Toast from './editor/Toast.svelte';
  import { current_project_name, errors, notifications, parse_errors } from '../store';
  import {
    debounce,
    get_asset_urls,
    get_tailwind_classes,
    code_string_to_json,
    processClasses
  } from '../utils';
  import { DEFAULT_DIR, DEFAULT_EXPORT_DIR, MAPS, dir } from '../constants';
  import { writeTextFile } from '@tauri-apps/api/fs';
  import { join, documentDir } from '@tauri-apps/api/path';
  import { Command } from '@tauri-apps/api/shell';
  import Options from './Options.svelte';
  import GuiEditor from './ide/GuiEditor.svelte';
  import type { RoguelighterDataFile, RoguelighterProject, View } from '../types/engine';
  import type { GameData } from '../types/game';
  import { SvelteComponent } from 'svelte';

  // BACKLOG: vite includes error
  // BACKLOG: sometimes editor styles not loading up

  export let project: RoguelighterProject;
  let options_open = false;
  let current_scene_id = 0;
  let view: View = 'code';
  let previousView: View = 'scene';
  let code_button: HTMLButtonElement;
  let scene_button: HTMLButtonElement;
  let agents: GameData['agents'];
  let code_editor: any;

  function switch_to_game() {
    let current_scene = project.scenes.get(current_scene_id);
    if (view == 'scene') {
      if (!current_scene) {
        notifications.danger('No scene is selected, cannot start the game');
        return;
      }

      if (![...current_scene.agents.values()].includes('player')) {
        notifications.danger('Player is not in the scene, cannot start the game');
        return;
      }
    }

    view = 'game';
  }

  function handle(e: KeyboardEvent) {
    if (e.ctrlKey) {
      switch (e.code) {
        case 'KeyT': {
          if (view == 'scene') {
            switch_to_game();
          } else if (view == 'game') {
            view = 'scene';
          }
          break;
        }
        case 'KeyS': {
          code_editor.format_document();
          recalculate();
          save_file();
          break;
        }
      }
    }
  }

  let bg_asset_urls = new Map<string, string>();
  let agent_asset_urls = new Map<string, any>();

  async function calc_asset_urls(parsed: GameData) {
    try {
      ({ backgrounds: bg_asset_urls, agents: agent_asset_urls } = await get_asset_urls(
        $current_project_name,
        parsed.agents
      ));
    } catch (e) {
      console.log(e);
    }
  }

  function save_file() {
    let scenes = structuredClone(project.scenes);

    for (let scene of scenes.values()) {
      for (let map of MAPS) {
        // @ts-expect-error
        scene[map] = Array.from(scene[map]);
      }
    }

    let obj: RoguelighterDataFile = { code: project.code, scenes: Array.from(scenes) };
    let file_contents = JSON.stringify(obj);

    writeTextFile(`${DEFAULT_DIR}\\${$current_project_name}\\data.json`, file_contents, { dir });
  }

  const commands: Array<string> = [
    // BACKLOG:
    // # Create Roguelighter Exports/cache
    // # git clone --filter=blob:none --sparse https://github.com/roguelighter
    // # git sparse-checkout add apps/export-app
    // # npm i
    // # git sparse-checkout add packages/roguelighter-core
    // # manipulate apps/export-app/src/routes/+page.svelte to match the project (reset every time)
    // # delete everything in static, copy assets from original project to static, generate asset_urls
    // # get to the root of export-app
    // # npm run tauri build
    // # wait for build
    // # cd src-tauri/target/release
    // # copy roguelighter-export-app.exe to Roguelighter Projects/[project]/export/[platform]
    'export'
    // 'export'
  ];

  async function export_game() {
    const documents = await documentDir();
    const project_path = await join(documents, `${DEFAULT_DIR}/${$current_project_name}`);

    const bat_name = 'export';
    const bat_content = `
cd ../..

if not exist "${DEFAULT_EXPORT_DIR}" (
  mkdir "${DEFAULT_EXPORT_DIR}"
  cd "${DEFAULT_EXPORT_DIR}"
  git clone --filter=blob:none --sparse https://github.com/roguelighterengine/roguelighter cache
  cd cache
  git sparse-checkout add apps/export-app
  git sparse-checkout add packages/roguelighter-core
  npm i
  cd apps/export-app

  cd ${project_path}
  del ${bat_name}.bat
) else (
  cd ${project_path}
  del ${bat_name}.bat
)
`;

    await writeTextFile(project_path + '/' + bat_name + '.bat', bat_content);

    for (let command of commands) {
      let c = new Command('cmd', ['/C', command], { cwd: project_path, encoding: 'utf-8' });
      c.on('close', (data) => {
        console.log(`command finished with code ${data.code} and signal ${data.signal}`);
      });
      c.on('error', (error) => console.error(`command error: "${error}"`));
      c.stdout.on('data', (line) => console.log(`command stdout: "${line}"`));
      c.stderr.on('data', (line) => console.log(`command stderr: "${line}"`));
      await c.execute();
    }
  }

  let initialized = false;

  function recalculate() {
    let parsed = code_string_to_json(project.code);

    if (typeof parsed == 'object') {
      processClasses(Array.from(get_tailwind_classes(parsed.gui).values()).join(' '));
      calc_asset_urls(parsed);
      agents = parsed.agents;
      initialized = true;
    }
  }

  $: view, save_file(), recalculate();

  function highlight(pre: HTMLPreElement) {
    const lines = pre.textContent?.split('\n');

    if (!$parse_errors.error || !$parse_errors.error.includes('at')) return;
    console.log($parse_errors.error);

    let line_number = parseInt($parse_errors?.error?.split('at')[1].split(':')[0]) || 0;

    const line = lines[line_number - 1];

    if (line) {
      let text = pre.innerHTML?.replace(
        line,
        `<span id="error" class="bg-red-600 w-full">${line}</span>`
      );
      pre.innerHTML = text;
    }
  }
</script>

<svelte:window on:keydown={handle} />

{#if initialized}
  <main class="relative flex flex-col w-full h-full overflow-hidden select-none">
    <Options bind:open={options_open}></Options>
    <nav
      class="absolute top-0 z-40 bg-zinc-800 w-full h-12 flex flex-row items-center justify-between p-2 px-4 text-zinc-200"
    >
      <a href="/" class=""
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6 hover:text-emerald-400 duration-150 ease-out"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125
           1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
      </a>
      <div class="flex flex-row gap-2">
        <button
          bind:this={code_button}
          class:btn-primary={view == 'code'}
          class="btn-outline"
          on:click={() => {
            previousView = view;
            view = 'code';
          }}
          >Code
        </button>

        <!-- <button
          class:btn-primary={view == 'gui'}
          class="btn-outline"
          on:click={() => {
            previousView = view;
            view = 'gui';
          }}
          >GUI
        </button> -->
        <button
          bind:this={scene_button}
          class:btn-primary={view == 'scene'}
          class="btn-outline"
          on:click={() => {
            previousView = view;
            view = 'scene';
          }}>Scene</button
        >
        <button
          class:btn-primary={view == 'logs'}
          class="btn-outline"
          on:click={() => {
            previousView = view;
            view = 'logs';
          }}
          >Logs
        </button>
      </div>
      <button on:click={() => (options_open = true)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      </button>
    </nav>
    {#if view == 'scene'}
      <SceneEditor
        bind:bg_asset_urls
        bind:agent_asset_urls
        bind:current_scene_id
        bind:project
        bind:agents
        on:change={debounce(save_file, 100)}
        on:switch_view={switch_to_game}
        on:unfocus={() => scene_button.focus()}
      />
    {:else if view == 'game'}
      <Game
        DEV
        {bg_asset_urls}
        {agent_asset_urls}
        {current_scene_id}
        {project}
        on:exit={() => (view = 'scene')}
      />
    {/if}
    <div
      class="absolute top-12 left-0 h-screen w-screen {view == 'code' ? 'z-10' : '-z-10 hidden'}"
    >
      <!-- <GuiEditor></GuiEditor> -->
      <CodeEditor
        bind:this={code_editor}
        bind:view
        bind:code={project.code}
        on:unfocus={() => code_button.focus()}
        on:change={save_file}
      ></CodeEditor>
    </div>
    <Toast />
  </main>
{:else}
  <!-- BACKLOG: add button to go back -->
  <main class="bg-zinc-700 h-full text-white p-4 flex flex-col gap-2">
    <p>Engine has not been initialized.</p>
    {#if $parse_errors.error}
      <pre class="overflow-auto h-full w-full bg-zinc-800 rounded p-2" use:highlight>
        {@html $parse_errors.json}
      </pre>
      <div class="inline-flex justify-between">
        <p class="text-red-400">{$parse_errors.error}</p>
        <a class="btn-outline" href="#error">Show error line </a>
      </div>
    {/if}
  </main>
{/if}
