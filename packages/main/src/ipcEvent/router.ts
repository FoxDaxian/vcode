import { ipcMain } from 'electron';
import { UpdateRouter } from '../../../utils/const/index';
import createVm from '../utils/createVm';
import stringify from '../utils/stringify';
import type SocketBase from '../../../utils/socket/SockeBase';
import { join } from 'path';

export default ({
    pageRootPath,
    virtual_module,
    server
}: {
    pageRootPath: string;
    virtual_module: Map<string, Vm>;
    server: SocketBase;
}) => {
    ipcMain.on(UpdateRouter, (event, info: RouteInfo) => {
        const {
            child,
            source,
            insertOrNew,
            parentRoutePath,
            routePath,
            routeName
        } = info;
        console.log(parentRoutePath, routePath, routeName, 'parentRoutePath');
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
        virtual_module.set(module.path, module);
        server.send('getVm', stringify(virtual_module));
    });
};
