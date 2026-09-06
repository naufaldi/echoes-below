export interface QuestProgress {
 id:string;
 title:string;
 chapter:number;
 kind:'main'|'side';
 status:'active'|'completed'|'missed'|'declined';
 steps:{label:string;done:boolean}[];
 reward:string;
}
