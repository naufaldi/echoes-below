import {writeFileSync} from 'node:fs';
import {createSave,applyAction,publicSave,legalActions} from '../server/game';
let save=createSave({name:'Elf Rogue QA',classId:'scout',raceId:'elf',backgroundId:'delver',appearanceId:'moss',rulesVersion:'curated-srd-5.2.1-v1',companions:{mira:{classId:'adept',raceId:'human',appearanceId:'moon'},oren:{classId:'guardian',raceId:'dwarf',appearanceId:'ember'}}});
save.sceneId='cookfire';save=applyAction(save,'fight',n=>n);save.turn!.actorId='hero';save.turnIndex=save.turn!.order.indexOf('hero');
const before=publicSave(save);const dodged=publicSave(applyAction(structuredClone(save),'tactical:dodge',n=>n));const hurt=structuredClone(before);hurt.party[0].hp-=2;const moveId=(legalActions(save).find(a=>a.id==='tactical:move:3:0')??legalActions(save).find(a=>a.id.startsWith('tactical:move:')))!.id;const moved=publicSave(applyAction(structuredClone(save),moveId,n=>n));save=applyAction(save,'tactical:attack:guard-1',n=>n);const after=publicSave(save);
writeFileSync('public/__rogue-combat-fixture.json',JSON.stringify({before,after,moved,dodged,hurt}));console.log('fixture',before.mode,after.logs.at(-1)?.animation);
