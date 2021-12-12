#!/usr/bin/env node

const { build, createLogger } = require('vite');
const electronPath = require('electron');
const { spawn } = require('child_process');

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
const setupMainPackageWatcher = () => {
    const logger = createLogger(LOG_LEVEL, {
        prefix: '[main]'
    });

    /** @type {ChildProcessWithoutNullStreams | null} */
    let spawnProcess = null;

    return getWatcher({
        name: 'reload-app-on-main-package-change',
        configFile: 'packages/main/vite.config.js',
        writeBundle() {
            if (spawnProcess !== null) {
                spawnProcess.kill('SIGINT');
                spawnProcess = null;
            }

            spawnProcess = spawn(String(electronPath), ['--disable-http-cache​', '.']);

            spawnProcess.stdout.on(
                'data',
                (d) =>
                    d.toString().trim() &&
                    logger.warn(d.toString(), { timestamp: true })
            );
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
