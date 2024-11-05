import type { PageLoad } from './$types';

import { readTextFile } from '@tauri-apps/plugin-fs';
import { PROJECTS_DIR, MAPS, baseDir } from 'roguelighter-core';
import JSON5 from 'json5';
import { SvelteMap } from 'svelte/reactivity';

export const load: PageLoad = async ({ params }) => {
  const res = await readTextFile(`${PROJECTS_DIR}\\${params.name}\\data.json`, { baseDir });
  let parsed = JSON5.parse(res);
  parsed.name = params.name;
  parsed.scenes = parsed.scenes.length ? new SvelteMap(parsed.scenes) : new SvelteMap();

  for (let scene of parsed.scenes.values()) {
    for (let map of MAPS) {
      scene[map] =
        Array.isArray(scene[map]) && scene[map].length
          ? new SvelteMap(scene[map])
          : new SvelteMap();
    }
  }

  console.log(parsed);

  return {
    project: parsed
  };
};
