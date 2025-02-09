import { createDialog, createMenu } from 'svelte-headlessui';
import type { AgentConfig } from './game';
import { ERROR_MESSAGES } from '../constants';

export type ErrorType = keyof typeof ERROR_MESSAGES;

export type OnError = (type: ErrorType, e: any) => void;

export interface PlayableAgent<N extends string> extends AgentConfig<N> {
  name: N;
  x: number;
  y: number;
  state: string;
}

export type PlayableAgents = Map<number, PlayableAgent<'player'>>;

export interface Scene {
  name: string;
  backgrounds: Map<number, string>;
  agents: Map<number, string>;
  width: number;
  height: number;
}

// export type AgentAssetUrls = Map<string, { default: string; [key: string]: string }>;
export type AgentAssetUrls = Map<string, string>;
export type BackgroundAssetUrls = Map<string, string>;
export type AssetType = 'backgrounds' | 'agents';
export type EntryTuple = [key: string, path: string, type: AssetType];
export type EntryObject = {
  name: string;
  path: string;
  type: AssetType;
};

export interface RoguelighterProject {
  name: string;
  code: string;
  scenes: Map<number, Scene>;
  starting_scene_id: number;
  scene_index: number;
}

export interface ParseErrorObject {
  code: string;
  json_string: string;
  error: string;
}

export interface RoguelighterDataFile {
  code: string;
  scenes: Array<[number, Scene]>;
  starting_scene_id: number;
  scene_index: number;
}

export interface PlayableScene extends Omit<Scene, 'agents'> {
  agents: Map<number, PlayableAgent<'player'>>;
}

// UI

export type DialogController = ReturnType<typeof createDialog>;
export type DropdownController = ReturnType<typeof createMenu>;

export type View = 'code' | 'gui' | 'scene' | 'game' | 'logs';

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type AgentStates = { player: any };

type SpriteConfig = {
  /** The total number of frames in the spritesheet. */
  frame_count?: number;
  /** The desired frames per second of the animation. */
  fps?: number;
  /** The number of columns in the spritesheet. */
  columns?: number;
  /** The number of rows in the spritesheet. */
  rows?: number;
  /** The start frame of the current animation. */
  start_frame?: number;
  /** The end frame of the current animation. */
  end_frame?: number;
  /** Delay the start of the animation in ms. */
  delay?: number;
  /** The texture filtering applied to the spritesheet. */
  filter?: 'nearest' | 'linear';
};
