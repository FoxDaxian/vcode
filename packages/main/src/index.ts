import { app, BrowserWindow, ipcMain } from 'electron';
import { join, parse, relative, normalize, resolve } from 'path';
import slash from 'slash';
import hash from 'hash-sum';
import { readFileSync, writeFileSync } from 'fs';
import sfc2source from './sfc2source';
import { URL } from 'url';
import { parse as sfcParse } from '@vue/compiler-sfc';
import { fork } from 'child_process';
import Server from '../../utils/socket/Server.js';

// ipc
const server = new Server();

server.connect().then(() => {
    // 响应vite的虚拟模块请求
    server.on('fetchVm', (id: string) => {
        server.send('sendVm', id);
    });
});

const root = join(__dirname, '../../../');

const isDevelopment = import.meta.env.MODE === 'development';

let url = '0.0.0.0';
const viteServer = fork(join(root, 'packages/main/viteProcess/child.js'), {});
viteServer.on(
    'message',
    function (data: { type: string; payload: Record<string, any> }) {
        switch (data.type) {
            case 'listening':
                console.log('服务监听成功...');
                url = data.payload.url;
                appStart();
                break;
            default:
                break;
        }
    }
);

// 根组件
const rootModulePath = join(
    __dirname,
    '../../renderer/src/components/mainContent.vue'
);
const rootModule: Vm = {
    path: rootModulePath,
    source: readFileSync(rootModulePath).toString(),
    childComponent: []
};
//

const virtual_module = new Map<string, Vm>();
virtual_module.set(rootModulePath, rootModule);

let mainWindow: BrowserWindow | null = null;

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

    ipcMain.on('add-component', (event, info: Info) => {
        // 目前只考虑用vcode初始化的新项目，先不兼容旧项目

        let vModule: Vm | undefined;
        // id是父id，得设置到父id上
        const { id, child } = info;
        console.log(parse(id));
        const resolvedPath = parse(id);

        if (virtual_module.has(id)) {
            vModule = virtual_module.get(id);
        } else {
            // 不能没有啊，没有的话直接给bk报错
        }

        const sonVm: Vm = {
            path: join(resolvedPath.dir, resolvedPath.name, child),
            source: sfc2source(sfcParse(info.source).descriptor),
            childComponent: []
        };
        vModule?.childComponent?.push(sonVm);
        console.log(vModule, '看看源码');

        // 设置完之后，需要更新parent组件的代码，直接写入文件模拟手工改动就行，然后触发vite，进而进行通信
        // 然后获取在这个阶段收集到的对应组件信息，有的话就返回，没有就报错（以防报错，加个默认的错误页面，给用户提示）

        // 通信完成，还差互相通信 + 转换 + 页面操作触发
        // 页面 -> ipc main -> 更新页面（加import和标签） -> 触发vite-dev -> node-ipc -> ipc main -> 获取后渲染到页面
        // 往后加的组件里差标签要怎么做？magic-string？
        // 如果加组件指纹的话，估计得改vnode
        // 或者在主进程 再 调用下createElementVNode，进而获取scopeId，把它作为组件指纹即可，这样不用改vue相关内容？可以尝试下
        // writeFileSync(join(__dirname, '../../renderer/src/components/mainContent.vue'), sfc2source(containerDesc, componentDesc));
    });

    /**
     * If you install `show: true` then it can cause issues when trying to close the window.
     * Use `show: false` and listener events `ready-to-show` to fix these issues.
     *
     * @see https://github.com/electron/electron/issues/25012
     */
    mainWindow.on('ready-to-show', () => {
        mainWindow?.show();

        if (import.meta.env.MODE === 'development') {
            mainWindow?.webContents.openDevTools();
        }
    });

    await mainWindow.loadURL(url);
};

app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

function appStart() {
    app.whenReady()
        .then(createWindow)
        .catch((e) => console.error('Failed create window:', e));

    // Auto-updates
    if (import.meta.env.PROD) {
        app.whenReady()
            .then(() => import('electron-updater'))
            .then(({ autoUpdater }) => autoUpdater.checkForUpdatesAndNotify())
            .catch((e) => console.error('Failed check updates:', e));
    }
}

const isSingleInstance = app.requestSingleInstanceLock();

if (!isSingleInstance) {
    app.quit();
    process.exit(0);
}

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
