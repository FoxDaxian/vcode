import vendorsConfig from '../../electron-vendors.config.json';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { builtinModules } from 'module';

const { chrome } = vendorsConfig;

const PACKAGE_ROOT = dirname(fileURLToPath(import.meta.url));

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
    mode: process.env.MODE,
    root: PACKAGE_ROOT,
    envDir: process.cwd(),
    resolve: {
        alias: {
            '@': join(PACKAGE_ROOT)
        }
    },
    build: {
        sourcemap: 'inline',
        target: `chrome${chrome}`,
        outDir: 'dist',
        assetsDir: '.',
        minify: process.env.MODE !== 'development',
        lib: {
            entry: 'src/index.ts',
            formats: ['cjs']
        },
        rollupOptions: {
            external: ['electron', ...builtinModules],
            output: {
                entryFileNames: '[name].cjs'
            }
        },
        emptyOutDir: true,
        brotliSize: false
    }
};

export default config;
