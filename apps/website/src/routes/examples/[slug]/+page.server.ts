import { read } from '$app/server';
import type { PageServerLoad } from './$types';
import type { ExampleJson } from '$lib/types';
import type { Scene } from 'roguelighter-core/utils';
import {
  template_json_code as template,
  json_to_code_string,
  REPLACER
} from 'roguelighter-core/utils';

export const load: PageServerLoad = async ({ params }) => {
  const slug = params.slug;
  const jsonFile = read(`/src/examples/${slug}.json`);

  let example = (await jsonFile.json()) as ExampleJson;

  const json_code = structuredClone(template);
  Object.assign(json_code, example.overrides);
  let template_code_string = json_to_code_string(json_code);

  for (let [to_be_replaced, new_value] of REPLACER) {
    template_code_string = template_code_string.replace(to_be_replaced, new_value);
  }

  for (let [to_be_replaced, new_value] of example.replacer) {
    template_code_string = template_code_string.replace(to_be_replaced, new_value);
  }

  example.project.code = template_code_string;
  example.project.scenes = new Map(example.project.scenes);
  // @ts-expect-error
  let scene = example.project.scenes.get(0) as Scene;

  scene.backgrounds = new Map(scene?.backgrounds);
  scene.agents = new Map(scene?.agents);
  scene.portals = new Map();

  return {
    example
  };
};
