/* eslint-env node */

import { chrome } from '../../electron-vendors.config.json';
import autoImport from 'rollup-plugin-auto-import';
import { join } from 'path';
import { builtinModules } from 'module';
import vue from '@vitejs/plugin-vue';
import Client from '../utils/socket/Client';
import { VmProfix } from '../utils/const/index';
import event from 'events';

class MyEmitter extends event.EventEmitter {}

const myEmitter = new MyEmitter();

const client = new Client();
client.connect();

client.on('sendVm', ({ id, source }) => {
    myEmitter.emit(id, source);
});

function getvm(event) {
    return new Promise((res) => {
        myEmitter.on(event, (data) => {
            res(data);
        });
    });
}

// 把vite-plugin过程拿过来，即可作为组件进行渲染
const code = `
<template>
    <div class="test">虚拟模块</div>
</template>

<script lang="ts" setup>
console.log('虚拟模块');
</script>

<style lang="less" scoped>
.test{
    color: red;
}
</style>
`;

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
        {
            name: 'vcode-plugin',
            resolveId(source) {
                if (source.startsWith(`${VmProfix}/`)) {
                    return source;
                }
                return null;
            },
            async load(id) {
                if (id.startsWith(`${VmProfix}/`)) {
                    client.send('fetchVm', id);
                    return await getvm(id);
                }
                return null;
            }
        },

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
        port: 6661,
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
