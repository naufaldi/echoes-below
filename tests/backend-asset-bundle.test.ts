import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,cpSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
test('release asset audit rejects an omitted external buffer and changed model bytes',()=>{
 const folder=mkdtempSync(join(tmpdir(),'echoes-asset-qa-'));
 try{
  cpSync(new URL('../public/assets',import.meta.url),join(folder,'assets'),{recursive:true});
  const run=()=>execFileSync(process.execPath,['scripts/verify-asset-bundle.mjs',folder],{cwd:new URL('../',import.meta.url),stdio:'pipe'});
  assert.match(run().toString(),/Verified \d+ models/);
  const bin=join(folder,'assets/expansion/Bookcase_2.bin'),original=readFileSync(bin);rmSync(bin);
  assert.throws(run,(error:any)=>/Missing bundled dependency: assets\/expansion\/Bookcase_2.bin/.test(error.stderr.toString()));
  writeFileSync(bin,original);
  const model=join(folder,'assets/kaykit/Knight.glb'),bytes=readFileSync(model);bytes[bytes.length-1]^=1;writeFileSync(model,bytes);
  assert.throws(run,(error:any)=>/Bundled bytes differ: assets\/kaykit\/Knight.glb/.test(error.stderr.toString()));
 }finally{rmSync(folder,{recursive:true,force:true});}
});
