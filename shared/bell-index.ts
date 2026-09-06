export const INDEX_PLATES=['witness','keeper','vessel'] as const;
export type IndexPlate=typeof INDEX_PLATES[number];
export function bellIndexState(flags:Record<string,boolean>){return {read:!!flags['index:read'],solved:!!flags['index:solved'],sequence:[0,1,2].flatMap(slot=>INDEX_PLATES.filter(part=>flags[`index:${slot}:${part}`]))};}
