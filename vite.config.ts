import { defineConfig } from 'vite';
import { resolve } from 'path';

import { cmmvPlugin } from './plugins/vite-plugin-cmmv';

export default defineConfig({
    plugins: [cmmvPlugin()],
    build: {
        target: 'esnext',
        minify: 'terser',
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'cmmv',
            formats: ['es', 'umd', 'iife']
        }
    }
})