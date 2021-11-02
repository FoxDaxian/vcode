/* eslint-env node */

import { chrome } from '../../electron-vendors.config.json';
import autoImport from 'rollup-plugin-auto-import';
import { join } from 'path';
import { builtinModules } from 'module';
import vue from '@vitejs/plugin-vue';

const PACKAGE_ROOT = __dirname;

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
    mode: process.env.MODE,
    root: PACKAGE_ROOT,
    resolve: {
        alias: {
            '@': join(PACKAGE_ROOT, 'src'),
            '@assets': join(PACKAGE_ROOT, 'assets')
        }
    },
    plugins: [
        vue(),
        autoImport({
            exclude: [/\.less\b/, /\.html\b/],
            inject: {
                vue: [
                    'onDeactivated',
                    'onActivated',
                    'defineProps',
                    'toRef',
                    'onBeforeUnmount',
                    'nextTick',
                    'unref',
                    'watch',
                    'onMounted',
                    'ref',
                    'computed',
                    'defineComponent',
                    'reactive',
                    'toRefs',
                    'createApp',
                    'watchEffect',
                    'getCurrentInstance'
                ],
                'vue-router': [
                    'useRoute',
                    'onBeforeRouteLeave',
                    'useRouter',
                    'createWebHistory',
                    'createRouter'
                ]
            }
        })
    ],
    base: '',
    server: {
        fs: {
            strict: true
        }
    },
    build: {
        sourcemap: true,
        target: `chrome${chrome}`,
        outDir: 'dist',
        assetsDir: '.',
        rollupOptions: {
            external: [...builtinModules]
        },
        emptyOutDir: true,
        brotliSize: false
    }
};

export default config;
