import {GameError,log,type Save} from './game.js';
import type {ActionOption} from '../shared/types.js';

const lines:Record<string,[string,string]>={
 approach:["Before we go down, choose what matters to you: answers, people, or simply getting us home. I can look for a route; I cannot choose your reason.","There is no shame in checking our supplies before a dark doorway. Tell me when you are ready. We enter together."],
 hall:["A room can threaten us without an enemy in it. Let us look carefully before deciding where to put our weight.","Do not rush a dangerous crossing to impress anyone. Asking for help is a decision, too."],
 cookfire:["We can listen before reaching for weapons. If a conversation fails, we can still decide what to do next.","I will stand with you, but I would rather understand someone before fighting them. Your call."],
 prison:["Let us keep the person in front of us in mind, not just the door between us. A useful clue is not the only reason to help.","A locked gate is a problem, not an excuse to abandon someone. Let us consider the tools we actually have."],
 bell:["Before committing, think about what we have learned. A loud answer is not always a certain one.","Whatever you decide here, make it your decision. I can offer strength; I cannot lend you conviction."],
 archive:["I prefer a question with room for doubt to an answer that demands obedience. Let us compare what we learn before deciding whom to trust.","Records can matter to living people. I want us to remember that when a page becomes more convenient than a person."],
 market:["A bargain can sound fair until you ask who pays for it. Let us ask that question before we agree.","We can refuse an offer without making an enemy of everyone here. Patience costs less than a fight."],
 roots:["Let us leave ourselves a way back. Curiosity works better when everyone has a chance to return with what we learn.","Check on the others before pressing ahead. Reaching a destination alone is not the victory I came for."],
 choir:["I want to hear what people mean, not only how convincingly they say it. We can ask another question before choosing a side.","A promise should survive the quiet after it is spoken. Let us make only the promises we mean to keep."],
 depth:["We have come a long way. That does not mean we owe the next demand our agreement. We can still choose carefully.","I am here with you now. Take the time you need; I would rather understand the last choice than rush toward it."],
};
const checkInKey=(s:Save,id:string)=>`checkin:${s.sceneId.split('-')[0]}:${id}`;
export function checkInActions(s:Save):ActionOption[]{
 if(s.mode!=='explore'||s.companionStoryId||s.party[0].hp<=0)return[];
 return (['mira','oren'] as const).filter(id=>s.party.some(a=>a.id===id&&a.hp>0)&&!s.flags[checkInKey(s,id)]).map(id=>({id:`checkin:${id}`,label:`Check in with ${id==='mira'?'Mira':'Oren'}`,description:`Sit with ${id==='mira'?'Mira':'Oren'} a moment and hear what is on ${id==='mira'?'her':'his'} mind. No roll and no reward.`,kind:'interact',actorId:id,targetId:id}));
}
export function resolveCheckIn(original:Save,id:string):Save{
 if(!checkInActions(original).some(a=>a.id===id))throw new GameError(422,'ACTION','That companion conversation is not available now.');
 const s=structuredClone(original),who=id.split(':')[1] as 'mira'|'oren';s.presentation=[];
 const text=(lines[s.sceneId]??lines[s.sceneId.split('-')[0]]??lines.approach)[who==='mira'?0:1];
 s.flags[checkInKey(s,who)]=true;
 log(s,text,who,[],'authored');s.revision++;s.updatedAt=new Date().toISOString();return s;
}
