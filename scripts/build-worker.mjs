import {build} from 'esbuild';
await build({entryPoints:['hosted/worker.ts'],bundle:true,format:'esm',platform:'neutral',target:'es2022',outfile:'dist/server/index.js',external:['node:crypto'],minify:true});

import {readdir,readFile} from 'node:fs/promises';
import {EXPEDITION} from '../shared/campaign.ts';
for(const file of await readdir('dist/client/assets'))if(file.endsWith('.js')){const code=await readFile('dist/client/assets/'+file,'utf8');if(EXPEDITION.some(room=>code.includes(room.clue)))throw new Error('Private campaign clues leaked into the client bundle.');}
// The local scene preview (#46) is registered only by the Fastify app; the hosted Worker must never ship it.
if((await readFile('dist/server/index.js','utf8')).includes('/api/dev/'))throw new Error('The local-only /api/dev/ routes leaked into the hosted Worker.');
