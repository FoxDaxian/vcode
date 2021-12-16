import { app, BrowserWindow, ipcMain } from 'electron';
import MagicString from 'magic-string';
import { join, parse, relative, normalize, resolve } from 'path';
import { readFileSync, writeFileSync, statSync } from 'fs';
import sfc2source from './sfc2source';
import { parse as sfcParse } from '@vue/compiler-dom';
import { fork } from 'child_process';
import Server from '../../utils/socket/Server.js';
import { VmProfix } from '../../utils/const/index';
import getAstPos from './utils/getAstPos';

const virtual_module = new Map<string, Vm>();
// ipc
const server = new Server();

const defaultCom = [
    '<template>',
    '    <div>未找到对应组件，请检查后重试</div>',
    '</template>'
].join('\n');
server.connect().then(() => {
    // 响应vite的虚拟模块请求
    server.on('fetchVm', (id: string) => {
        const filePath = replaceVmPrefix(id);
        const source = virtual_module.get(filePath)?.source ?? defaultCom;
        server.send('sendVm', { id, source });
    });
});

const root = join(__dirname, '../../../');

const isDevelopment = import.meta.env.MODE === 'development';

let url = '0.0.0.0';
const viteServer = fork(join(root, 'packages/main/viteProcess/child.js'), {
    execArgv: ['--experimental-specifier-resolution=node']
});

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
    '../../renderer/src/components/interactionComponent/pageContent.vue'
);
const rootModule: Vm = {
    path: rootModulePath,
    source: readFileSync(rootModulePath).toString(),
    childComponent: []
};
function createVm(vmInfo: Vm): Vm {
    return {
        path: vmInfo.path,
        source: vmInfo.source,
        childComponent: vmInfo.childComponent ?? []
    };
}
//

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
        const { id, child, source, pos } = info;
        const childWithoutExt = child.split('.')[0];
        const tag = childWithoutExt
            .split('-')
            .map((c) => c[0].toUpperCase() + c.slice(1))
            .join('');
        const { dir, name } = parse(id);
        const parentVm: Vm = virtual_module.get(replaceVmPrefix(id))!;

        const sonPath = join(dir, name, `${childWithoutExt}.vue`);
        const sonVm: Vm = createVm({
            path: sonPath,
            source: source,
            childComponent: []
        });

        virtual_module.set(sonPath, sonVm);
        // 是否已经引入了这个子模块
        const includedIndex = parentVm.childComponent?.findIndex(
            (item) => item.path === sonVm.path
        );
        // 命名一致，得提示是否覆盖，如果覆盖，则继续，否则让用户修改
        parentVm.childComponent?.push(sonVm);

        const s = new MagicString(parentVm.source);
        const ast = sfcParse(parentVm.source);
        const importStatement = `import ${tag} from '${VmProfix}${sonPath}'`;

        const { start: tStart, indent: tIndent } = getAstPos(
            ast,
            pos,
            'template'
        );
        const { start: sStart, indent: sIndent } = getAstPos(
            ast,
            pos,
            'script'
        );

        s.appendLeft(tStart, `<${tag}></${tag}>\n${' '.repeat(tIndent)}`);
        s.appendLeft(sStart, `\n${importStatement}`);

        if (fileExist(parentVm.path)) {
            writeFileSync(parentVm.path, s.toString());
            parentVm.source = s.toString();
        } else if (virtual_module.has(parentVm.path)) {
            // 如果是虚拟文件的话，得监听虚拟file，才方便触发vue更新
            viteServer.send(parentVm.path)
            // console.log(parentVm.source);
            // console.log(s.toString(), '被插入的内容');
            parentVm.source = s.toString();
        } else {
            console.log('不存在啊');
        }
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

function replaceVmPrefix(id: string) {
    return id.replace(VmProfix, '');
}

function fileExist(filepath: string) {
    try {
        statSync(filepath);
        return true;
    } catch (e) {
        return false;
    }
}
