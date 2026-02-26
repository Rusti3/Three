export type IslandParams = {
  seed: number;
  n: number;
  xyScale: number;
  zScale: number;
  mountainAmp: number;
  cliffAmp: number;
  namePrefix: string;
};

export type GeneratedIslandData = {
  n: number;
  x: Float32Array;
  y: Float32Array;
  top: Float32Array;
  bottom: Float32Array;
  oceanMask: Uint8Array;
  xyScale: number;
  zScale: number;
};

export type PlacedIsland = {
  x: number;
  z: number;
  radius: number;
};
