import {EXPEDITION,expeditionRoom,type ExpeditionId,type ExpeditionRoom} from '../shared/campaign.js';
import {CURATED_ENCOUNTERS} from './encounters.js';
import type {Save} from './game.js';
import type {CampaignRecap,EndingId} from '../shared/endings.js';

/** Derived from flags every Release 1 save already records; nothing here is persisted. */
export interface PlaystyleLedger {mercy:number;force:number;stance:'mercy'|'force';mira:number;oren:number;companion:Companion;scrit:'guardian'|'friend'|'scattered'|'stranger';}
type Axis = 'stance'|'scrit'|'companion';
export type ForkVariant = 'mercy'|'force'|'ally'|'wary'|'mira'|'oren';
interface RoomVariant {description:string;choice:[string,string];outcomes:[string,string];dc:number;ally?:{name:string;description:string};}
interface RoomFork {room:ExpeditionId;axis:Axis;variants:Partial<Record<ForkVariant,RoomVariant>>;}
/** Chapter I trust that game.ts already writes as `trust:<key>` flags. */
const MIRA_TRUST=['trap','warning'],OREN_TRUST=['rescue','scrit','vark'];
type Companion = 'mira'|'oren';
/**
 * Issue #57: which companion each room's options win over, read from the `<room>:choice:<n>` flags every save already
 * records. Mercy (sparing, releasing, comforting) and insight (naming, exposing, seeing through) raise Mira's trust;
 * protection (rescuing, guarding, securing a route) and duty (oaths, records owed to families, accountability) raise
 * Oren's. A pragmatic or forceful option raises neither (—). Fork variants reword the options but keep this meaning.
 *
 * | Room      | Option 0                                   | Option 1                                       |
 * |-----------|--------------------------------------------|------------------------------------------------|
 * | archive-1 | Mira: raise the sluice for the ferryman    | Oren: divert the current, keep the records     |
 * | archive-2 | Mira: share the lantern                    | Oren: preserve the living pages                |
 * | archive-3 | Mira: restore the librarian's name         | —: take the drawer, leave the vigil            |
 * | archive-4 | Oren: break the pocket, rescue the medic   | —: open the drain first                        |
 * | archive-5 | Mira: release the copied witnesses         | Oren: keep the testimony for the families      |
 * | archive-6 | Mira: trust Mira to lead                   | Oren: Oren secures a line                      |
 * | archive-7 | Mira: challenge the altered contract       | —: pay with the false history                  |
 * | archive-8 | Mira: send the names home                  | Oren: hold the council to account              |
 * | market-1  | Oren: sponsor the refugees                 | Mira: expose the altered tally                 |
 * | market-2  | Mira: repair the refugee lanterns          | —: finish Tavin's map first                    |
 * | market-3  | Oren: return the fallen soldier's shield   | —: buy the record as evidence                  |
 * | market-4  | Mira: close the council's pipe             | Oren: build a filter for everyone              |
 * | market-5  | Mira: perform the true testimony           | Oren: keep the route secret                    |
 * | market-6  | —: convert the furnace to coal             | Mira: shut it until the prisoners are free     |
 * | market-7  | Oren: demand a public accounting           | Mira: negotiate restitution                    |
 * | market-8  | Mira: carry the letters into the prison    | Oren: keep the letters safe with a courier     |
 * | roots-1   | Mira: teach the prisoners shared silence   | —: cut the irrigation line                     |
 * | roots-2   | Mira: quiet the copied voices              | Oren: keep one recording as evidence           |
 * | roots-3   | Oren: organise a shared evacuation         | Mira: let the healer leave with the injured    |
 * | roots-4   | Mira: open the channel with Tavin          | Oren: have Tavin guide the evacuation          |
 * | roots-5   | Mira: open the valves in sequence          | —: shatter the reservoir                       |
 * | roots-6   | Oren: refuse the bargain before everyone   | Mira: offer Ys a place                         |
 * | roots-7   | Mira: relieve the guard of its duty        | Oren: break the seal, open the gate for all    |
 * | roots-8   | Mira: stay for the reunion meal            | Oren: send the captives up first               |
 * | choir-1   | Mira: let the novice enter on her terms    | Mira: expose the false trial                   |
 * | choir-2   | Mira: teach the missing rest               | Oren: keep the score for the machine           |
 * | choir-3   | Mira: tell the child's joke                | Oren: ask the elders to lift the rule for all  |
 * | choir-4   | Mira: demonstrate the complete circuit     | Oren: refuse the conductor another sacrifice   |
 * | choir-5   | Oren: name the dead, renew Oren's oath     | Oren: carry the record to the families         |
 * | choir-6   | Mira: let each singer speak apart          | —: cooperate without forgiving                 |
 * | choir-7   | Mira: perform the rest, release Aras       | —: break the cage by force                     |
 * | choir-8   | Oren: keep the evacuation route manned     | —: prepare the circuit                         |
 * | depth-1   | Mira: recover the founders' names          | Oren: map the emergency exits                  |
 * | depth-2   | Mira: offer the guards safe passage        | Oren: hold the escape route                    |
 * | depth-3   | Mira: name the contradictions together     | —: cover the glass                             |
 * | depth-4   | Mira: explain the release to Neris         | Oren: secure Neris's escape first              |
 * | depth-5   | Mira: read the maintenance anchors         | Oren: hold the bridge while the party crosses  |
 * | depth-6   | Mira: speak the release command            | —: dismantle the guardian                      |
 * | depth-7   | Mira: free every keeper                    | Oren: seal the core under a shared watch       |
 * | depth-8   | —: go home together                        | Oren: stay to help the settlements             |
 */
/** Every room must appear; tests/backend-playstyle.test.ts checks that, because ExpeditionId is too wide for the compiler to. */
export const CHOICE_TRUST:Record<string,readonly [Companion|null,Companion|null]>={
 'archive-1':['mira','oren'],'archive-2':['mira','oren'],'archive-3':['mira',null],'archive-4':['oren',null],'archive-5':['mira','oren'],'archive-6':['mira','oren'],'archive-7':['mira',null],'archive-8':['mira','oren'],
 'market-1':['oren','mira'],'market-2':['mira',null],'market-3':['oren',null],'market-4':['mira','oren'],'market-5':['mira','oren'],'market-6':[null,'mira'],'market-7':['oren','mira'],'market-8':['mira','oren'],
 'roots-1':['mira',null],'roots-2':['mira','oren'],'roots-3':['oren','mira'],'roots-4':['mira','oren'],'roots-5':['mira',null],'roots-6':['oren','mira'],'roots-7':['mira','oren'],'roots-8':['mira','oren'],
 'choir-1':['mira','mira'],'choir-2':['mira','oren'],'choir-3':['mira','oren'],'choir-4':['mira','oren'],'choir-5':['oren','oren'],'choir-6':['mira',null],'choir-7':['mira',null],'choir-8':['oren',null],
 'depth-1':['mira','oren'],'depth-2':['mira','oren'],'depth-3':['mira',null],'depth-4':['mira','oren'],'depth-5':['mira','oren'],'depth-6':['mira',null],'depth-7':['mira','oren'],'depth-8':[null,'oren'],
};
/** Rooms before the cut-off whose saved choice won this companion over. */
const earned=(f:Save['flags'],rooms:string[],who:Companion)=>rooms.filter(id=>(CHOICE_TRUST[id]??[]).some((c,i)=>c===who&&f[`${id}:choice:${i}`])).length;
const chapterOneDone=(s:Save)=>!!expeditionRoom(s.sceneId)||s.sceneId==='aftermath'&&s.mode==='complete';
/** A room only counts toward Mercy when a fight was actually on offer there; Curated rooms without an authored encounter count for neither side. */
const fightOffered=(s:Save,id:string)=>!s.tactical||!!CURATED_ENCOUNTERS[id];
/** Reads Chapter I and every expedition room before `before`, so a fork cannot change while the party stands in it. */
export function playstyleLedger(s:Save,before?:string):PlaystyleLedger{
 const f=s.flags,end=before?EXPEDITION.findIndex(r=>r.id===before):EXPEDITION.length,rooms=EXPEDITION.slice(0,end<0?EXPEDITION.length:end).map(r=>r.id);
 const varkFought=chapterOneDone(s)&&!f.negotiated;
 const mercy=+!!f.fed+ +!!f.negotiated+ +(!!f.passage&&!f.guardsDefeated&&!f.fed)+rooms.filter(id=>f[`${id}:resolved`]&&!f[`${id}:defendersDefeated`]&&fightOffered(s,id)).length;
 const force=+!!f.guardsDefeated+ +varkFought+rooms.filter(id=>f[`${id}:defendersDefeated`]).length;
 const mira=MIRA_TRUST.filter(k=>f[`trust:${k}`]).length+earned(f,rooms,'mira');
 const oren=OREN_TRUST.filter(k=>f[`trust:${k}`]).length+earned(f,rooms,'oren');
 const scrit=f.guardsDefeated?'scattered':f.fed?(chapterOneDone(s)&&!s.inventory.seal?'guardian':'friend'):'stranger';
 return {mercy,force,stance:force>mercy?'force':'mercy',mira,oren,companion:oren>mira?'oren':'mira',scrit};
}
const scritAlly=(l:PlaystyleLedger)=>l.scrit==='guardian'||l.scrit==='friend';
const axisVariant=(axis:Axis,l:PlaystyleLedger):ForkVariant=>axis==='stance'?l.stance:axis==='companion'?l.companion:scritAlly(l)?'ally':'wary';

/** One ledger-driven room per chapter. Choice indices keep their original meaning, so CHOICE_TRUST, XP and cross-room consequences are unchanged. */
export const ROOM_FORKS:RoomFork[]=[
 {room:'archive-1',axis:'stance',variants:{
  mercy:{description:'Black water laps at the steps below Briarwatch. Word has come down from the relay that your party chose talk over steel wherever it could. The ferryman has already loosened his chain and holds a lantern high for you. The seal still makes his boat list.',choice:['Raise the sluice with the ferryman’s help','Divert the current through the empty crypt'],outcomes:['The ferryman works the far wheel while you raise the sluice. His boat rides level, and he promises to carry future refugees. The lower records are soaked.','The ferryman helps you divert the current, then lets his boat go. The records survive. He says the relay’s peace was worth one boat; you are not sure he means it.'],dc:-2,ally:{name:'The ferryman',description:'He heard how you left the relay and has come to the steps to help.'}},
  force:{description:'Black water laps at the steps below Briarwatch. Word of the fighting at the relay has reached the water before you. The ferryman has chained his boat to the far post and keeps a gaff hook across his knees. The seal makes his boat list, and he does not intend to carry armed strangers.',choice:['Persuade the ferryman to raise the sluice with you','Force the current through the empty crypt'],outcomes:['The ferryman lowers the hook and raises the sluice beside you. He saves his boat and promises to carry future refugees, though he watches your weapons the whole way. The lower records are soaked.','You force the current through the crypt. The ferryman cuts his boat loose rather than carry you. The records survive, but his livelihood does not.'],dc:2},
 }},
 {room:'market-5',axis:'scrit',variants:{
  ally:{description:'A travelling troupe rehearses the fall of Briarwatch. A goblin in a borrowed crown waves from the wings: Scrit’s cousin carried the relay’s story down to the market, and the troupe has crossed out the villains the council wrote for you. Behind the curtain, the writer admits the council still expects its own version.',choice:['Perform the true testimony with Scrit’s cousin','Keep the route secret and change the ending'],outcomes:['Scrit’s cousin plays the cook who shared a ration. The audience hears the missing travellers’ names, and the council can no longer dismiss them as rumours.','The play ends in reconciliation, with a goblin cook taking the final bow. The secret route remains safe, but the public truth is postponed.'],dc:-2,ally:{name:'Scrit’s cousin',description:'A goblin player who carried the relay’s story to the market.'}},
  wary:{description:'A travelling troupe performs the fall of Briarwatch. In the council’s script your party are raiders who emptied the relay, and the audience hisses on cue. No one from the relay has come down to tell it differently. Behind the curtain, the writer admits the council supplied every line.',choice:['Win the crowd back with the true testimony','Keep the route secret and change the ending'],outcomes:['The hissing stops when the missing travellers’ names are read. The council can no longer dismiss them as rumours, though some still watch you as the villains of the first act.','The play ends in reconciliation without you in it. The secret route remains safe, and the market keeps its story about you.'],dc:2},
 }},
 {room:'roots-4',axis:'companion',variants:{
  mira:{description:'A lamp burns beside a half-finished map. Tavin sits at the desk, alive and exhausted. Mira reaches him first; she has followed your lead through every hard mercy since Briarwatch, and she does not wait for permission. He tells her that leaving now will doom the other prisoners.',choice:['Let Mira promise to open the channel together','Convince Tavin to guide the evacuation'],outcomes:['Mira makes the promise in their family’s old shorthand. Tavin laughs, then cries, then picks up his pen. For the first time, he accepts help.','Tavin gives you the map and starts leading prisoners to the lift. Mira walks the first stretch beside him before letting him go ahead.'],dc:-2},
  oren:{description:'A lamp burns beside a half-finished map. Tavin sits at the desk, alive and exhausted. Mira stops at the edge of the lamplight, suddenly unable to cross it. Oren, who has stood beside your harder decisions, goes in first and sits down across from Tavin as if this were a debriefing. Tavin says leaving now will doom the other prisoners.',choice:['Help Oren draw up a release plan with Tavin','Have Oren organise an orderly evacuation'],outcomes:['Oren and Tavin argue over the map like old colleagues until the release channel has a schedule. Mira finally sits down beside her brother.','Oren sorts the prisoners into watches and Tavin leads the first group to the lift. Mira follows the last group, still deciding what to say to him.'],dc:0},
 }},
 {room:'choir-4',axis:'stance',variants:{
  mercy:{description:'Bound guardians surround the fifth tuning stone, but their weapons are already lowered. Novices from the Hall of Breaths have spread word of a party that would rather talk than fight. The conductor still insists that one person must replace the keeper for everyone else to leave.',choice:['Demonstrate the complete circuit with the novices','Challenge the conductor’s authority'],outcomes:['The novices hold each socket while you light the sequence. The guardians step aside before the circuit is complete.','The choir refuses another sacrifice, and the novices stand with you. The conductor must defend the machine instead of commanding obedience.'],dc:-2,ally:{name:'Choir novices',description:'Singers who heard how you have travelled and came to help.'}},
  force:{description:'Bound guardians surround the fifth tuning stone with their weapons raised. The choir has heard how you came through the deep: steel first. The conductor has sounded the alarm and insists that one person must replace the keeper for everyone else to leave.',choice:['Demonstrate the complete circuit under guard','Break the conductor’s hold on the guardians'],outcomes:['You light the sockets one by one with blades at your back. Only when the circuit shines do the guardians lower their weapons.','The guardians’ binding breaks under force. The choir refuses another sacrifice, but some singers keep their distance from you.'],dc:2},
 }},
 {room:'depth-2',axis:'scrit',variants:{
  ally:{description:'A final band of goblins guards a room full of packed bags. One of them wears a scrap of cloth stitched with Scrit’s mark. A runner from the relay reached them days ago with word that the people from above shared food at the cookfire. They lower their spears before you speak.',choice:['Offer the guards safe passage upward','Ask them to help hold the escape route'],outcomes:['The guards shoulder their bags and leave with Scrit’s directions to the market. The runner promises the cookfire will be lit when they arrive.','The guards agree to one final watch, this time with a clear end, a road home and Scrit’s people waiting at the top.'],dc:-2,ally:{name:'Scrit’s runner',description:'A goblin runner carrying word from the relay cookfire.'}},
  wary:{description:'A final band of goblins guards a room full of packed bags. No word has come from the relay or from Vark, and they fear your arrival means both are lost. They form a shield wall the moment they see your weapons.',choice:['Lower your weapons and offer safe passage upward','Order them to hold the escape route'],outcomes:['One by one the guards lower their spears. They leave with directions to the market, still glancing back at you.','The guards hold the route because you leave them no other choice. Their watch has an end now, but they will not remember who gave it kindly.'],dc:2},
 }},
];
/** Issue #15: Scrit's people only help at the ferry when Scrit was actually befriended. */
const ARCHIVE_8_WITHOUT_SCRIT='The families above receive word. The ferryman and two Briarwatch lamplighters help carry the pages out of the flooded relay.';

export function roomFork(s:Save,id:string){const fork=ROOM_FORKS.find(f=>f.room===id);if(!fork)return;const key=axisVariant(fork.axis,playstyleLedger(s,id));return {fork,key,variant:fork.variants[key]!};}
/** The room as this run experiences it: the base template with any fork variant and continuity applied. */
export function playedRoom(s:Save,id:string):ExpeditionRoom|undefined{
 const room=expeditionRoom(id);if(!room)return;
 const fork=roomFork(s,id);
 if(fork){const v=fork.variant;return {...room,description:v.description,choice:v.choice,outcomes:v.outcomes,dc:room.dc+v.dc};}
 if(id==='archive-8'&&!scritAlly(playstyleLedger(s,id)))return {...room,outcomes:[ARCHIVE_8_WITHOUT_SCRIT,room.outcomes[1]]};
 return room;
}
export function projectFork(s:Save,scene:{id:string;description:string;entities:{id:string;name:string;kind:string;position:[number,number];description:string;modelClassId?:string}[]}){
 const fork=roomFork(s,scene.id);if(!fork)return;const v=fork.variant;
 scene.description=v.description;
 const way=scene.entities.find(e=>e.id==='encounter');if(way)way.description=v.choice[0];
 if(v.ally&&s.mode==='explore'&&!s.flags[`${scene.id}:resolved`])scene.entities.push({id:'fork-ally',name:v.ally.name,kind:'npc',modelClassId:'scout',position:[4,2],description:v.ally.description});
}

export interface CampaignEnding {id:EndingId;title:string;text:string;}
export const ENDINGS:Record<CampaignEnding['id'],CampaignEnding>={
 'open-relay':{id:'open-relay',title:'The Open Relay',text:'Scrit’s cookfire burns at the top of the stairs, and the relay is a crossroads again instead of a border. Market workers, freed prisoners and goblin cooks share the same road to Briarwatch. Every fight you could have started and did not is someone walking home. When the Bell rings now, it announces arrivals.'},
 'long-way-home':{id:'long-way-home',title:'The Long Way Home',text:'The people you spared walk ahead of you: prisoners, singers, a ferryman with his boat. The relay is quiet, and the goblins who kept it have gone somewhere no one thought to ask about. Briarwatch will learn a gentle story of the descent with one conversation still unfinished. The Bell stays silent until someone goes back down to finish it.'},
 'broken-chain':{id:'broken-chain',title:'The Broken Chain',text:'You fought your way to the heart of the machine, and at the end you broke the oldest bargain instead of another enemy. No keeper remains below. Briarwatch is safe, and wary of the party who made it so; the market tells your story with the weapons left in. Some below will remember the cost. Neris will remember the morning.'},
 'iron-watch':{id:'iron-watch',title:'The Iron Watch',text:'The core is sealed, the stairs are guarded, and every threat between Briarwatch and the deep has met your steel. Oren draws up a rota that no one is bound to keep forever, and Mira signs it last. The town above sleeps soundly. The deep remembers you as the party that won, and keeps quiet when your watch passes.'},
};
/** The whole run decides the ending: the ledger's stance, Scrit's fate and the Heart Below decision. The final room's choice closes it. */
export function selectEnding(s:Save):CampaignEnding{
 const l=playstyleLedger(s);
 if(l.stance==='mercy')return ENDINGS[scritAlly(l)?'open-relay':'long-way-home'];
 return ENDINGS[s.flags['depth-7:choice:0']?'broken-chain':'iron-watch'];
}
export function endingText(s:Save){const ending=selectEnding(s),last=EXPEDITION.at(-1)!;return `${ending.title}. ${ending.text} ${last.outcomes[s.flags[`${last.id}:choice:0`]?0:1]}`;}
/** #69: the ending page's recap. Only for a finished descent whose saved ending carries this title; a Release 1 run keeps the untitled ending it was shown and gets none. */
export function campaignRecap(s:Save):CampaignRecap|undefined{
 if(s.mode!=='complete'||s.sceneId!==EXPEDITION.at(-1)!.id)return;
 const ending=selectEnding(s);if(!s.ending?.startsWith(`${ending.title}. `))return;
 const l=playstyleLedger(s);return {endingId:ending.id,title:ending.title,stance:l.stance,spared:l.mercy,fought:l.force,companion:l.companion,mira:l.mira,oren:l.oren,scrit:l.scrit};
}
