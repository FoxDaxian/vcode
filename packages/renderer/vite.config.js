/* eslint-env node */

import { chrome } from '../../electron-vendors.config.json';
import autoImport from 'rollup-plugin-auto-import';
import { join } from 'path';
import { builtinModules } from 'module';
import vue from '@vitejs/plugin-vue';
import Client from '../utils/socket/Client';
import event from 'events';
// import conpiler from '@vue/compiler-sfc';

class MyEmitter extends event.EventEmitter {}

const myEmitter = new MyEmitter();

const client = new Client();
client.connect();

client.on('sendVm', (data) => {
    myEmitter.emit(data, data);
});

function getvm(event) {
    return new Promise((res) => {
        myEmitter.once(event, (data) => {
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
// const res = conpiler.parse(code, {
//     filename: 's.vue',
//     sourceMap: false
// });
// console.log(res);
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
            resolveId(source) {
                if (source.startsWith('@vcode_virtual_module')) {
                    return source;
                }
                return null;
            },
            async load(id) {
                if (id.startsWith('@vcode_virtual_module')) {
                    client.send('fetchVm', id);
                    const vm = await getvm(id);
                    return `export default {vm: '${vm}'}`;
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
