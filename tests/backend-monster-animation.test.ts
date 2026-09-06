import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('shipped goblinoid death clip contains scaled pelvis descent without locomotion root motion',()=>{
 const bytes=readFileSync(new URL('../public/assets/quaternius/Imp-animated.glb',import.meta.url));const jsonSize=bytes.readUInt32LE(12);const doc=JSON.parse(bytes.subarray(20,20+jsonSize).toString());const binary=bytes.subarray(28+jsonSize);
 const death=doc.animations.find((a:any)=>a.name==='Death');const channel=death.channels.find((c:any)=>c.target.path==='translation'&&doc.nodes[c.target.node].name==='pelvis');assert.ok(channel,'Death needs pelvis translation to reach the floor.');
 const accessor=doc.accessors[death.samplers[channel.sampler].output],view=doc.bufferViews[accessor.bufferView],start=(view.byteOffset??0)+(accessor.byteOffset??0);const firstZ=binary.readFloatLE(start+8),lastZ=binary.readFloatLE(start+(accessor.count-1)*12+8);assert.ok(firstZ-lastZ>.5,`Pelvis must descend: ${firstZ} -> ${lastZ}`);
 for(const name of ['Idle','Walk','Run']){const clip=doc.animations.find((a:any)=>a.name===name);assert.ok(clip.channels.every((c:any)=>c.target.path!=='translation'));}
});

test('animated death geometry rests on the standing ground plane',async()=>{const {execFileSync}=await import('node:child_process');assert.doesNotThrow(()=>execFileSync(process.execPath,['scripts/check-monster-ground.mjs'],{cwd:new URL('../',import.meta.url),stdio:'pipe'}));});
