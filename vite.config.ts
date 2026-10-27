import { defineConfig } from 'vite';
import {sites} from '@openai/sites-vite-plugin';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react(),sites()],server:{host:'127.0.0.1',port:5173,proxy:{'/api':'http://127.0.0.1:4317'}},build:{outDir:'dist/client',chunkSizeWarningLimit:1600,
 // Libraries change far less often than the game, so they ship as separately cached chunks.
 rolldownOptions:{output:{codeSplitting:{groups:[{name:'three',test:/node_modules[\\/]three[\\/]/},{name:'react',test:/node_modules[\\/](react|react-dom|scheduler)[\\/]/},{name:'r3f',test:/node_modules[\\/](@react-three|three-stdlib|zustand|its-fine|suspend-react|react-use-measure|use-sync-external-store)[\\/]/}]}}}}});
