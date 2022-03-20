import { app, BrowserWindow, Menu, MenuItem } from 'electron';
import { join } from 'path';
import sfc2source from './sfc2source';
import { fork } from 'child_process';
import Server from '../../utils/socket/Server.js';
import createVm from './utils/createVm';
import stringify from './utils/stringify';
import comTemp from './utils/comTemp';
import { build, isMac } from './utils/shortcut';
import ipcRouter from './ipcEvent/router';
import ipcComponent from './ipcEvent/component';
import ipcCommonUtils from './ipcEvent/commonUtils';
import ipcAddComponentByDrag from './ipcEvent/addComponentByDrag';
import ipcFreshCache from './ipcEvent/freshCache';
import { GETALLCOM, GETALLUTIL } from '../../utils/const/index';
import renderProject from './utils/template/';
import { viteProcessPath } from './utils/path';
import { RouterDb, ModuleDb, UtilDb } from './db';

const virtual_module = new Map<string, Vm>();
const virtual_util = new Map<string, Util>();
const routerConfig = new Set<RouterConfig>(); // 路由配置

// 根组件
const pageRootPath = '/src/components';
const rootModulePath = join(pageRootPath, 'mainContent.vue');
const rootModule: Vm = createVm({
    path: rootModulePath,
    source: comTemp
});
virtual_module.set(rootModule.path, rootModule);

const moduleDb = new ModuleDb(virtual_module);
const utilDb = new UtilDb(virtual_util);
const routerDb = new RouterDb(routerConfig);

// ipc
const server = new Server();

server.connect().then(() => {
    server.on('fetchAllVm', () => {
        server.send('fetchAllVm', stringify(virtual_module));
    });
    server.on('fetchAllUtil', () => {
        server.send('fetchAllUtil', stringify(virtual_util));
    });
});

const isDevelopment = import.meta.env.MODE === 'development';

// 为什么会有多个呢？因为重启后导致的（是的）
let url = '0.0.0.0';
const viteServer = fork(viteProcessPath, {
    execArgv: ['--experimental-specifier-resolution=node']
});

const template = [
    new MenuItem({
        label: 'Electron',
        submenu: [
            {
                label: 'help',
                click: () => {
                    console.log('Electron rocks!');
                }
            }
        ]
    }),
    new MenuItem({
        label: 'more',
        submenu: [
            {
                label: 'build',
                accelerator: build,
                click: () => {
                    renderProject({
                        virtual_module,
                        virtual_util,
                        routerConfig
                    });
                }
            }
        ]
    })
];

Menu.setApplicationMenu(Menu.buildFromTemplate(template));

viteServer.on(
    'message',
    function (data: { type: string; payload: Record<string, any> }) {
        switch (data.type) {
            case 'listening':
                console.log('服务监听成功...');
                url = data.payload.url;
                // 路由数据更新
                Promise.all([
                    moduleDb.getData(),
                    utilDb.getData(),
                    routerDb.getData()
                ]).then(([m, u, r]) => {
                    // 暂时未考虑child，直接重置为map or set
                    m?.d?.forEach((_) => {
                        _[1].childComponent = new Map();
                        virtual_module.set(..._);
                    });
                    u?.d?.forEach((_) => virtual_util.set(..._));
                    r?.d?.forEach((_) => routerConfig.add(_));
                    appStart();
                });
                break;
            default:
                break;
        }
    }
);

let mainWindow: BrowserWindow | null = null;

// https://redis.io/topics/persistence redis database persistence
const createWindow = async () => {
    mainWindow = new BrowserWindow({
        width: 1500,
        height: 1000,
        show: false, // Use 'ready-to-show' event to show window
        webPreferences: {
            nodeIntegration: true,
            webviewTag: true,
            nativeWindowOpen: true,
            preload: join(__dirname, '../../preload/dist/index.cjs')
        }
    });

    ipcRouter({
        routerConfig,
        virtual_module,
        server,
        pageRootPath,
        rootModulePath
    });

    ipcAddComponentByDrag({
        virtual_module,
        server,
        viteServer
    });

    ipcComponent({
        virtual_module,
        server,
        viteServer,
        rootModulePath
    });
    ipcFreshCache({
        viteServer
    });

    ipcCommonUtils({
        virtual_util,
        server,
        viteServer
    });

    /**
     * If you install `show: true` then it can cause issues when trying to close the window.
     * Use `show: false` and listener events `ready-to-show` to fix these issues.
     *
     * @see https://github.com/electron/electron/issues/25012
     */
    mainWindow.on('ready-to-show', () => {
        mainWindow?.show();

        mainWindow?.webContents.send(
            GETALLCOM,
            [...virtual_module.values()]
                .map((vm) => vm.path)
                .filter((p) => p !== rootModulePath)
        );
        mainWindow?.webContents.send(
            GETALLUTIL,
            [...virtual_util.values()].map((vm) => vm.path)
        );

        if (import.meta.env.MODE === 'development') {
            mainWindow?.webContents.openDevTools();
        }
    });

    mainWindow.webContents.on('crashed', () => {
        console.log('崩溃了');
    });

    await mainWindow.loadURL(url);
};

app.on('quit', () => {
    console.log('quit事件');
});

app.on('window-all-closed', () => app.quit());

app.on('activate', () => {
    console.log('重新激活');
});
app.on('will-quit', () => {
    console.log('will-quit12332213');
});
app.on('before-quit', async (event) => {
    event.preventDefault();
    await collectAndShut();
    app.exit();
});
process.on('uncaughtException', async () => {
    await collectAndShut();
    process.exit(1);
});

async function collect() {
    await moduleDb.collect();
    await utilDb.collect();
    await routerDb.collect();
}
async function collectAndShut() {
    try {
        await collect();
        process.send &&
            process.send(viteServer.kill('SIGINT') ? 'success' : 'fail');
    } catch (e) {
        //
    }
}
// development环境下，监听 cmd c，以便于数据库同步
process.on('message', async (m) => {
    if (m === 'closeVite') {
        viteServer.kill('SIGINT');
    } else if (m === 'close') {
        // 自定义的文件缺少source map
        collectAndShut();
    } else if (m === 'collect') {
        await collect();
    }
});

app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});

function appStart() {
    // Auto-updates
    if (import.meta.env.PROD) {
        app.whenReady()
            .then(() => import('electron-updater'))
            .then(({ autoUpdater }) => autoUpdater.checkForUpdatesAndNotify())
            .catch((e) => console.error('Failed check updates:', e));
    }
    return app
        .whenReady()
        .then(createWindow)
        .catch((e) => console.error('Failed create window:', e));
}

// 是否启动单实例
// const isSingleInstance = app.requestSingleInstanceLock();

// if (!isSingleInstance) {
//     app.quit();
//     process.exit(0);
// }

app.disableHardwareAcceleration();

// Install "Vue.js devtools"
if (import.meta.env.MODE === 'development') {
    app.whenReady()
        .then(() => import('electron-devtools-installer'))
        .then(({ default: installExtension, VUEJS3_DEVTOOLS }) =>
            installExtension(VUEJS3_DEVTOOLS, {
                loadExtensionOptions: {
                    allowFileAccess: true
                }
            })
        )
        .catch((e) => console.error('Failed install extension:', e));
}
