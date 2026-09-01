export interface GameConfig {
  GRID_RADIUS_IN_HEX: number;
  HEX_RADIUS_IN_PIXEL: number;
  WORDS_FILE_PATH: string;
  DISTANCE_DECAY_FACTOR: number;
}

export const GAME_CONFIG: GameConfig = {
  GRID_RADIUS_IN_HEX: 3,
  HEX_RADIUS_IN_PIXEL: 48,
  WORDS_FILE_PATH: "../wordBank.json",
  DISTANCE_DECAY_FACTOR: 2,
} as const;
