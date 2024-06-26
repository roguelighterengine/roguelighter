<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import * as monaco from 'monaco-editor';
  import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
  import { create_types, debounce } from '../../utils';
  const dispatch = createEventDispatcher();

  import { watch } from 'tauri-plugin-fs-watch-api';
  import { join, documentDir } from '@tauri-apps/api/path';
  import { type FileEntry, readDir } from '@tauri-apps/api/fs';
  import { DEFAULT_DIR } from '../../constants';
  import { current_project_name } from '../../store';

  export let code: string;
  let editorElement: HTMLDivElement;
  let editor: monaco.editor.IStandaloneCodeEditor;
  let model: monaco.editor.ITextModel;
  let cached_entries: Array<FileEntry> = [];
  let filePath = '';

  export function set_code(new_code: string) {
    code = new_code;
    editor.setValue(code);
  }

  async function loadCode(code: string) {
    model = monaco.editor.createModel(code, 'typescript');
    editor.setModel(model);

    const entries = await readDir(filePath, { recursive: true });
    cached_entries = entries;
    model.setValue(code);

    await watch(
      filePath,
      async () => {
        const entries = await readDir(filePath, { recursive: true });
        cached_entries = entries;
        model.setValue(create_types(editor.getValue(), entries));
      },
      { recursive: true }
    );
  }

  onMount(async () => {
    const documentDirPath = await documentDir();
    filePath = await join(documentDirPath, `${DEFAULT_DIR}/${$current_project_name}/assets`);

    self.MonacoEnvironment = {
      getWorker: () => new tsWorker()
    };

    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

    // compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true
    });

    monaco.editor.createModel(create_types(code), 'typescript');

    editor = monaco.editor.create(editorElement, {
      automaticLayout: true,
      theme: 'vs-dark',
      tabSize: 2
    });

    editor.onDidChangeModelContent(
      debounce(() => {
        code = editor.getValue();
        update_types();
        dispatch('change');
      }, 200)
    );
    editor.onKeyUp((e) => {
      if (e.keyCode === monaco.KeyCode.Quote) {
        editor.trigger('', 'editor.action.triggerSuggest', '');
      }
    });

    // TODO: Built-in widget to replace key names

    await loadCode(code);
  });

  onDestroy(() => {
    monaco?.editor.getModels().forEach((model) => model.dispose());
    editor?.dispose();
  });

  function update_types() {
    const models = monaco.editor.getModels();
    let content_id = '';

    for (let model of models) {
      const value = model.getValue();
      if (!value) continue;
      if (value.includes('type Easing =')) {
        model.setValue(create_types(editor.getValue(), cached_entries));
      } else {
        content_id = model.id;
      }
    }
  }
</script>

<div class="h-full" bind:this={editorElement} />
