import { defineConfig } from 'vite';
import {sites} from '@openai/sites-vite-plugin';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react(),sites()],server:{host:'127.0.0.1',port:5173,proxy:{'/api':'http://127.0.0.1:4317'}},build:{outDir:'dist/client',chunkSizeWarningLimit:1600}});
