import {copyFileSync,existsSync,rmSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const files=['public/__elf-rogue-preview.glb','public/__rogue-combat-fixture.json'];
const mode=process.argv[2];
if(mode==='clean'){for(const f of files)rmSync(f,{force:true});}
else if(mode==='guard'){if(files.some(existsSync)){console.error('Local rogue preview files must not ship. Run npm run rogue:clean before building.');process.exit(1);}}
else if(mode==='prepare'){
 const source='output/characters/elf-rogue-v1/animation-v6c/elf-rogue-weapon-fix.glb';
 const sha=createHash('sha256').update(readFileSync(source)).digest('hex');
 if(sha!=='eed37e08843e810e046bb739fcff55417beeae56fdff1797fb010497350bab4b')throw Error('V6c asset checksum mismatch');
 for(const f of files)if(existsSync(f))throw Error(`${f} already exists; inspect it, then run rogue:clean explicitly`);
 const result=spawnSync(process.execPath,['--import','tsx','local-review/make-fixture.ts'],{stdio:'inherit'});
 if(result.status!==0){rmSync(files[1],{force:true});process.exit(result.status??1);}
 copyFileSync(source,files[0]);console.log('Local preview ready. Run npm run dev and open ?elfRoguePreview=1&combatReview=1. Clean before any build.');
}else throw Error('Use prepare, clean, or guard');
