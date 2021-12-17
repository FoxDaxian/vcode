/* eslint-env node */

import vendorsConfig from '../../electron-vendors.config.json';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
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
    plugins: [
        vue(),
        {
            name: 'vcode-plugin',
            resolveId(source) {
                if (source.startsWith(VmProfix)) {
                    return source;
                }
                if (source.startsWith(GetCurComponent)) {
                    return source;
                }
                return null;
            },
            load(id) {
                if (id.startsWith(VmProfix)) {
                    return vm.get(id.replace(VmProfix, '')).source || defaultCom;
                }
                if (id.startsWith(GetCurComponent)) {
                    return 'null';
                }
                return null;
            },
            transform(code, id) {
                if (id.startsWith(GetCurComponent)) {
                    return `const s = \`${
                        vm.get(id.replace(GetCurComponent, '')).source
                    }\`;export { s as default }`;
                }
            }
        }
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
