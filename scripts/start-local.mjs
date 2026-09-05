import {spawn} from 'node:child_process';
import {mkdirSync,openSync,closeSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const url='http://127.0.0.1:4317';
let running=false;
try {const response=await fetch(url+'/api/health',{signal:AbortSignal.timeout(1000)});running=response.ok&&(await response.json()).ok===true;}catch{}
if(!running){mkdirSync(root+'data',{recursive:true});const fd=openSync(root+'data/server.log','a',0o600);const child=spawn(process.execPath,['--env-file-if-exists=.env','--import','tsx','server/index.ts'],{cwd:root,detached:true,stdio:['ignore',fd,fd]});child.unref();closeSync(fd);for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,250));try{const r=await fetch(url+'/api/health');if(r.ok){running=true;break;}}catch{}}}
if(!running){console.error('The game could not start. Check data/server.log.');process.exitCode=1;}else{console.log('Echoes Below is ready at '+url);if(process.argv.includes('--open'))spawn('/usr/bin/open',[url],{stdio:'ignore',detached:true}).unref();}
