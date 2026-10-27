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
test('audio gate rejects an unlisted file, changed bytes and a licence outside the allow-list',()=>{
 const folder=mkdtempSync(join(tmpdir(),'echoes-audio-qa-'));
 try{
  cpSync(new URL('../public/assets',import.meta.url),join(folder,'assets'),{recursive:true});
  const run=()=>execFileSync(process.execPath,['scripts/verify-asset-bundle.mjs',folder],{cwd:new URL('../',import.meta.url),stdio:'pipe'});
  const fails=(pattern:RegExp)=>assert.throws(run,(error:any)=>pattern.test(error.stderr.toString()));
  assert.match(run().toString(),/\d+ licensed audio files/);
  const stray=join(folder,'assets/audio/sfx/unlisted.m4a');writeFileSync(stray,'not audio');
  fails(/Audio file has no manifest entry: assets\/audio\/sfx\/unlisted.m4a/);rmSync(stray);
  const clip=join(folder,'assets/audio/sfx/miss.m4a'),original=readFileSync(clip),changed=Buffer.from(original);changed[changed.length-1]^=1;writeFileSync(clip,changed);
  fails(/Audio hash differs from manifest: assets\/audio\/sfx\/miss.m4a/);writeFileSync(clip,original);
  const manifestPath=join(folder,'assets/audio/manifest.json'),manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
  assert.ok(manifest.files.every((f:any)=>['CC0-1.0','CC-BY-4.0'].includes(f.licence)&&f.sha256&&f.source&&f.retrieved&&f.changes));
  assert.ok(manifest.files.filter((f:any)=>f.file.startsWith('music/')).every((f:any)=>f.status==='pending-owner-approval'));
  manifest.files.find((f:any)=>f.file==='sfx/miss.m4a').licence='CC-BY-NC-4.0';writeFileSync(manifestPath,JSON.stringify(manifest));
  fails(/Audio licence not allowed: assets\/audio\/sfx\/miss.m4a \(CC-BY-NC-4.0\)/);
 }finally{rmSync(folder,{recursive:true,force:true});}
});
