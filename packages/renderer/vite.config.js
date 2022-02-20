/* eslint-env node */

import vendorsConfig from '../../electron-vendors.config.json';
import { join, dirname, sep } from 'path';
import { fileURLToPath, parse } from 'url';
import { builtinModules } from 'module';
import vue from '@vitejs/plugin-vue';
import {
    VmProfix,
    GetCurComponent,
    UtilProfix,
    GetCurUtil
} from '../utils/const/index.js';
import Client from '../utils/socket/Client.js';

const { chrome } = vendorsConfig;

const pageRootPath = '/src/components';

const defaultCom = [
    '<template>',
    '    <div>未找到对应组件，请检查后重试</div>',
    '</template>'
].join('\n');
const defaultUtil = [
    'export default {vcode: "there is no util, please check"}'
].join('\n');

const client = new Client();
const vm = new Map();
const util = new Map();
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

    client.send('fetchAllUtil');
    client.on('fetchAllUtil', (data) => {
        Object.entries(JSON.parse(data)).forEach(([key, value]) => {
            util.set(key, value);
        });
    });
    // TODO: 现在是直接一股脑更新，后续需要改成按需更新
    client.on('getUtil', (data) => {
        Object.entries(JSON.parse(data)).forEach(([key, value]) => {
            util.set(key, value);
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
            '@assets': join(PACKAGE_ROOT, 'assets'),
            '@vutil': UtilProfix
        }
    },
    define: {
        PAGEPATH: JSON.stringify(join(pageRootPath)),
        ROOTCOM: JSON.stringify(join(VmProfix, `${pageRootPath}/mainContent.vue`))
    },
    plugins: [
        {
            name: 'vcode-util',
            enforce: 'pre',
            resolveId(source) {
                if (source.startsWith(UtilProfix)) {
                    return source;
                }
            },
            load(id) {
                if (id.startsWith(UtilProfix)) {
                    return (
                        util.get(id.replace(UtilProfix + sep, '')).source ||
                        defaultUtil
                    );
                }
            }
        },
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
                        vm.get(pathname.replace(VmProfix, '')).source ||
                        defaultCom
                    );
                }
            }
        },
        {
            name: 'vcode-get-util',
            enforce: 'post',
            resolveId(source) {
                if (source.startsWith(GetCurUtil)) {
                    const { pathname } = parse(source);
                    return pathname;
                }
            },
            load(id) {
                if (id.startsWith(GetCurUtil)) {
                    return '';
                }
            },
            transform(code, id) {
                try {
                    if (id.startsWith(GetCurUtil)) {
                        return `const s = \`${
                            util.get(id.replace(GetCurUtil, '')).source
                        }\`;export { s as default }`;
                    }
                } catch (e) {
                    return 'const s = false;export { s as default }';
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
                try {
                    if (id.startsWith(GetCurComponent)) {
                        return `const s = \`${
                            vm.get(id.replace(GetCurComponent, '')).source
                        }\`;export { s as default }`;
                    }
                } catch (e) {
                    return 'const s = false;export { s as default }';
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
