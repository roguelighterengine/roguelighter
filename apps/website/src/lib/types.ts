import type {
  AgentAssetUrls,
  BackgroundAssetUrls,
  Setup,
  RoguelighterProject
} from 'roguelighter-core';

export interface TutorialJson {
  title: string;
  solution_tuples: Array<[key: string, answer: string]>;
  solution_object: Setup;
  project: RoguelighterProject;
  agent_asset_urls: AgentAssetUrls;
  bg_asset_urls: BackgroundAssetUrls;
  next?: string;
  prev?: string;
}

export interface ExampleJson {
  title: string;
  project: RoguelighterProject;
  agent_asset_urls: AgentAssetUrls;
  bg_asset_urls: BackgroundAssetUrls;
  replacer: Array<[to_be_replaced: string, new_value: string]>;
  overrides: Partial<Setup>;
}

// interface Tutorial {
//   header: string;
//   description: string;
//   project: RoguelighterProject;
//   solution: Setup;
//   solution_tuple: [string, any];
//   agent_asset_urls: AgentAssetUrls;
//   bg_asset_urls: BackgroundAssetUrls;
// }
