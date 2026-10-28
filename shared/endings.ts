// #69 The four campaign endings by id only. Titles and text stay in server/playstyle.ts (ENDINGS); a test keeps the two lists equal.
export const ENDING_IDS=['open-relay','long-way-home','broken-chain','iron-watch'] as const;
export type EndingId=typeof ENDING_IDS[number];
/** Derived from the finished run and attached to the public save only once the descent is complete, so no fork can be read from it. */
export interface CampaignRecap {endingId:EndingId;title:string;stance:'mercy'|'force';/** Fights the party could have started and did not. */spared:number;/** Fights the party won. */fought:number;/** The companion the run's choices won over, and each one's tally. */companion:'mira'|'oren';mira:number;oren:number;scrit:'guardian'|'friend'|'scattered'|'stranger';}
