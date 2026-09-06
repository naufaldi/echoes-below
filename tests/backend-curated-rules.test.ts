import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeCharacter,modifier,proficiency,spendAction,spendSlot,takeDamage,heal,deathSave,concentrationDC} from '../shared/curated-rules.js';
test('four classes have bounded level progression and separate spell resources',()=>{
 for(const c of ['fighter','rogue','wizard','cleric'] as const)for(let level=1;level<=8;level++){const a=makeCharacter(c,level);assert.equal(a.level,level);assert.equal(a.proficiency,level<5?2:3);assert.ok(a.maxHp>0);assert.equal(a.hitDice,level);assert.equal(a.slots.length,c==='wizard'||c==='cleric'?4:0);}
 assert.throws(()=>makeCharacter('fighter',9));assert.throws(()=>makeCharacter('wizard',0));assert.equal(modifier(9),-1);assert.equal(proficiency(5),3);
});
test('actions and slots reject over-spending without changing prior state',()=>{
 const a=makeCharacter('wizard',3);const b=spendAction(a,'action');assert.equal(a.economy.action,true);assert.equal(b.economy.action,false);assert.throws(()=>spendAction(b,'action'));
 const c=spendSlot(a,2);assert.equal(c.slots[1],1);assert.equal(a.slots[1],2);assert.throws(()=>spendSlot(a,3));assert.throws(()=>spendSlot(a,1.5));
});
test('damage applies temporary HP first and checks concentration only when needed',()=>{
 const a={...makeCharacter('wizard',3),temporaryHp:5,concentration:'bless'};const b=takeDamage(a,3,false,20);assert.equal(b.hp,a.hp);assert.equal(b.temporaryHp,2);assert.equal(b.concentration,'bless');
 assert.equal(takeDamage(a,8,false,1).concentration,null);assert.equal(concentrationDC(100),30);assert.equal(concentrationDC(23),11);
});
test('zero HP, critical damage and massive damage obey death rules',()=>{
 const a=makeCharacter('fighter',1);const down=takeDamage(a,a.hp);assert.equal(down.hp,0);assert.equal(down.dead,false);
 const critical=takeDamage(down,1,true);assert.equal(critical.death.failures,2);assert.equal(takeDamage(critical,1).dead,true);
 assert.equal(takeDamage(a,a.hp+a.maxHp).dead,true);
});
test('death saves stabilize, fail twice on one, revive on twenty and healing resets saves',()=>{
 const down=takeDamage(makeCharacter('rogue',1),100);const a={...down,dead:false};
 assert.equal(deathSave(a,1).death.failures,2);assert.equal(deathSave(a,20).hp,1);
 const stable=deathSave(deathSave(deathSave(a,10),10),10);assert.equal(stable.death.stable,true);assert.equal(stable.death.successes,0);
 const healed=heal(deathSave(a,1),4);assert.equal(healed.hp,4);assert.equal(healed.death.failures,0);assert.equal(heal(down,4).hp,0);
});
test('nonfinite and negative resource changes fail before mutation',()=>{const a=makeCharacter('fighter',1);for(const n of [-1,NaN,Infinity]){assert.throws(()=>takeDamage(a,n));assert.throws(()=>heal(a,n));}assert.throws(()=>deathSave({...a,hp:0},21));});
test('temporary HP do not stabilize or erase failures on an unconscious actor',()=>{
 const a={...takeDamage(makeCharacter('fighter',1),12),temporaryHp:5,death:{successes:1,failures:1,stable:false}};
 const hit=takeDamage(a,1);assert.equal(hit.hp,0);assert.equal(hit.death.failures,2);assert.equal(hit.death.successes,1);
});
