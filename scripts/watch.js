#!/usr/bin/env node

import { build, createLogger } from 'vite';
import electronPath from 'electron';
import { spawn } from 'child_process';
import readline from 'readline';
console.log(process.cwd());

/** @type 'production' | 'development'' */
const mode = (process.env.MODE = process.env.MODE || 'development');

/** @type {import('vite').LogLevel} */
const LOG_LEVEL = 'info';

/** @type {import('vite').InlineConfig} */
const sharedConfig = {
    mode,
    build: {
        watch: {}
    },
    logLevel: LOG_LEVEL
};

/** Messages on stderr that match any of the contained patterns will be stripped from output */
const stderrFilterPatterns = [
    // warning about devtools extension
    // https://github.com/cawa-93/vite-electron-builder/issues/492
    // https://github.com/MarshallOfSound/electron-devtools-installer/issues/143
    /ExtensionLoadWarning/
];

/**
 * @param configFile
 * @param writeBundle
 * @param name
 * @returns {Promise<import('vite').RollupOutput | Array<import('vite').RollupOutput> | import('vite').RollupWatcher>}
 */
const getWatcher = ({ name, configFile, writeBundle }) => {
    return build({
        ...sharedConfig,
        configFile,
        plugins: [{ name, writeBundle }]
    });
};

/**
 * Start or restart App when source files are changed
 * @param {import('vite').ViteDevServer} viteDevServer
 * @returns {Promise<import('vite').RollupOutput | Array<import('vite').RollupOutput> | import('vite').RollupWatcher>}
 */
/** @type {ChildProcessWithoutNullStreams | null} */
let spawnProcess = null;
const setupMainPackageWatcher = () => {
    const logger = createLogger(LOG_LEVEL, {
        prefix: '[main]'
    });

    return getWatcher({
        name: 'reload-app-on-main-package-change',
        configFile: 'packages/main/vite.config.js',
        writeBundle() {
            if (spawnProcess !== null) {
                spawnProcess.send('closeVite');
                spawnProcess.kill('SIGINT');
                spawnProcess = null;
            }

            spawnProcess = spawn(
                String(electronPath),
                ['--disable-http-cache​', '.'],
                {
                    stdio: [null, null, null, 'ipc']
                }
            );
            // cmd c回调，以防多个vite服务
            spawnProcess.on('message', (m) => {
                if (m === 'success') {
                    spawnProcess.kill('SIGINT');
                    spawnProcess = null;
                    process.exit(0);
                }
            });

            spawnProcess.stdout.on('data', (d) => {
                d.toString().trim() &&
                    logger.warn(d.toString(), { timestamp: true });
            });
            spawnProcess.stderr.on('data', (d) => {
                const data = d.toString().trim();
                if (!data) return;
                const mayIgnore = stderrFilterPatterns.some((r) =>
                    r.test(data)
                );
                if (mayIgnore) return;
                logger.error(data, { timestamp: true });
            });
        }
    });
};

/**
 * Start or restart App when source files are changed
 * @param {import('vite').ViteDevServer} viteDevServer
 * @returns {Promise<import('vite').RollupOutput | Array<import('vite').RollupOutput> | import('vite').RollupWatcher>}
 */
const setupPreloadPackageWatcher = () => {
    return getWatcher({
        name: 'reload-page-on-preload-package-change',
        configFile: 'packages/preload/vite.config.js',
        writeBundle() {
            console.log('这时候应该reload渲染页面');
        }
    });
};

(async () => {
    try {
        await setupPreloadPackageWatcher();
        await setupMainPackageWatcher();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();

// 监听后会阻止默认行为，需要手动添加上，然后推出的时候通知到主进程进行关闭操作
// process.on('SIGINT', function () {
//     console.log('监听 cmd + c');
//     console.log('Caught interrupt signal');
//     process.exit(0);
// });
// process.on('SIGTERM', function () {
//     console.log('SIGTERM');
//     process.exit(0);
// });
// process.on('SIGQUIT', function () {
//     console.log('SIGQUIT');
//     process.exit(0);
// });

readline.emitKeypressEvents(process.stdin);

if (process.stdin.isTTY) process.stdin.setRawMode(true);

process.stdin.on('keypress', (chunk, key) => {
    if (key && key.ctrl && key.name === 'c') {
        if (spawnProcess !== null) {
            spawnProcess.send('close');
        }
    }
});
