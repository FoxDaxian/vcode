import vendorsConfig from '../../electron-vendors.config.json';
import { builtinModules } from 'module';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const { node } = vendorsConfig;

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
            '@': PACKAGE_ROOT
        }
    },
    build: {
        sourcemap: 'inline',
        target: `node${node}`,
        outDir: 'dist',
        assetsDir: '.',
        minify: process.env.MODE !== 'development',
        lib: {
            entry: 'src/index.ts',
            formats: ['cjs']
        },
        rollupOptions: {
            external: [
                'electron',
                'electron-devtools-installer',
                ...builtinModules
            ],
            output: {
                entryFileNames: '[name].cjs'
            }
        },
        emptyOutDir: true,
        brotliSize: false
    }
};

export default config;
