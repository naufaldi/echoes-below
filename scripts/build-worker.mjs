import {build} from 'esbuild';
await build({entryPoints:['hosted/worker.ts'],bundle:true,format:'esm',platform:'neutral',target:'es2022',outfile:'dist/server/index.js',external:['node:crypto'],minify:true});

import {readdir,readFile} from 'node:fs/promises';
import {EXPEDITION} from '../shared/campaign.ts';
for(const file of await readdir('dist/client/assets'))if(file.endsWith('.js')){const code=await readFile('dist/client/assets/'+file,'utf8');if(EXPEDITION.some(room=>code.includes(room.clue)))throw new Error('Private campaign clues leaked into the client bundle.');}
