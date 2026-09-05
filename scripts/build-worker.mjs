import {build} from 'esbuild';
await build({entryPoints:['hosted/worker.ts'],bundle:true,format:'esm',platform:'neutral',target:'es2022',outfile:'dist/server/index.js',external:['node:crypto'],minify:true});
