// #66 Chapter title pages. Literal public text only, so the client can import this without shared/campaign.ts (which carries clues and outcomes).
/** Each prologue line is a sentence the party reads anyway: the room that leads into the chapter, then its first room. Chapter II's first room is a fork, so only the sentence both variants share is used. tests/backend-chapter-recap.test.ts checks the sources. */
export interface ChapterPage {chapter:number;numeral:string;name:string;prologue:string[];}
export const CHAPTER_PAGES:ChapterPage[]=[
 {chapter:1,numeral:'I',name:'The Bell Beneath Briarwatch',prologue:['Rain gathers in the ruts of a shattered supply cart.','Far beneath the hillside, a bell sounds once, though no wind reaches it.']},
 {chapter:2,numeral:'II',name:'The Drowned Archive',prologue:['In the silence, a deeper door unlocks beneath the relay.','Black water laps at the steps below Briarwatch.']},
 {chapter:3,numeral:'III',name:'The Ash Market',prologue:['Beyond the landing, warm air smells of coal and bread.','The Ash Market occupies a cavern around a cold furnace.']},
 {chapter:4,numeral:'IV',name:'The Rootbound Prison',prologue:['A freight lift descends through roots wider than houses.','Cells hang from branches in a cavern without sunlight.','Their locks are living knots.']},
 {chapter:5,numeral:'V',name:'The Hollow Choir',prologue:['From deeper stone comes a choir with one voice missing.','Stone pipes line a hall where each footstep becomes a note.']},
 {chapter:6,numeral:'VI',name:'The Last Descent',prologue:['Five stones answer from your pack and the final key fits.','The oldest stairs are carved from a single piece of black stone.']},
];
/** One finished chapter, derived from the save's flags and journal; attached to the public save only once the party has left the chapter (or finished the descent). */
export interface ChapterRecap {
 chapter:number;title:string;
 /** The decision taken in each room, as the label the player chose. */
 choices:{room:string;title:string;choice:string}[];
 /** Each companion's trust tally (the ending's ledger) at the end of the chapter, and how much of it this chapter earned. */
 trust:{mira:number;oren:number};trustDelta:{mira:number;oren:number};
 /** Fights this chapter's choices avoided and fights it won. */
 mercy:number;force:number;
 xp:number;
 /** Short consequences the player has already read. */
 changes:string[];
}
