import { ipcMain } from 'electron';
import { UPDATEROUTER, GETALLCOM } from '../../../utils/const/index';
import createVm from '../utils/createVm';
import stringify from '../utils/stringify';
import type SocketBase from '../../../utils/socket/SockeBase';
import { join } from 'path';

export default ({
    routerConfig,
    rootModulePath,
    pageRootPath,
    virtual_module,
    server
}: {
    routerConfig: Set<RouterConfig>;
    pageRootPath: string;
    rootModulePath: string;
    virtual_module: Map<string, Vm>;
    server: SocketBase;
}) => {
    ipcMain.on(UPDATEROUTER, (event, info: RouteInfo) => {
        const { child, source, parentRoutePath, routeName, routePath } = info;
        // about router
        // 得拆分啊，一个是更新组件的，一个是更新路由的，最小原子原则
        const pageComPath = join(
            pageRootPath,
            parentRoutePath as string,
            `${child}.vue`
        );
        const module: Vm = createVm({
            path: pageComPath,
            source: source
        });
        routerConfig.add({
            path: join(parentRoutePath, routePath),
            name: routeName,
            component: pageComPath
        });
        virtual_module.set(module.path, module);
        // 通知变动的组件
        event.reply(
            GETALLCOM,
            [...virtual_module.values()]
                .map((vm) => vm.path)
                .filter((p) => p !== rootModulePath)
        );
        server.send('getVm', stringify(virtual_module));
    });
};
