/* eslint-env node */

import vendorsConfig from '../../electron-vendors.config.json';
import { join, dirname } from 'path';
import { fileURLToPath, parse } from 'url';
import { builtinModules } from 'module';
import vue from '@vitejs/plugin-vue';
import { VmProfix, GetCurComponent } from '../utils/const/index.js';
import Client from '../utils/socket/Client.js';

const { chrome } = vendorsConfig;

const defaultCom = [
    '<template>',
    '    <div>未找到对应组件，请检查后重试</div>',
    '</template>'
].join('\n');

const client = new Client();
const vm = new Map();
client.connect().then(() => {
    client.send('fetchAllVm');
    client.on('fetchAllVm', (data) => {
        Object.entries(JSON.parse(data)).forEach(([key, value]) => {
            vm.set(key, value);
        });
    });
    // TODO: 现在是直接一股脑更新，后续需要改成按需更新
    client.on('getVm', (data) => {
        Object.entries(JSON.parse(data)).forEach(([key, value]) => {
            vm.set(key, value);
        });
    });
});

const PACKAGE_ROOT = dirname(fileURLToPath(import.meta.url));

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
    define: {
        PAGEPATH: JSON.stringify(join(PACKAGE_ROOT, 'src/page')),
        ROOTCOM: JSON.stringify(
            join(VmProfix, PACKAGE_ROOT, 'src/page/mainContent.vue')
        )
    },
    plugins: [
        {
            name: 'vcode-vm',
            enforce: 'pre',
            resolveId(source) {
                if (source.startsWith(VmProfix)) {
                    return source;
                }
            },
            load(id) {
                if (id.startsWith(VmProfix)) {
                    const { pathname, query } = parse(id);
                    if (query) {
                        return null;
                    }
                    return (
                        vm.get(pathname.replace(VmProfix, '')).source || defaultCom
                    );
                }
            }
        },
        {
            name: 'vcode-get-component',
            enforce: 'post',
            resolveId(source) {
                if (source.startsWith(GetCurComponent)) {
                    const { pathname } = parse(source);
                    return pathname;
                }
            },
            load(id) {
                if (id.startsWith(GetCurComponent)) {
                    return '';
                }
            },
            transform(code, id) {
                if (id.startsWith(GetCurComponent)) {
                    return `const s = \`${
                        vm.get(id.replace(GetCurComponent, '')).source
                    }\`;export { s as default }`;
                }
            }
        },
        vue()
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
