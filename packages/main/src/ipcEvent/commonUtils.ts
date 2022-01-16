import { ipcMain } from 'electron';
import {
    UPDATECOMMONUTILS,
    TIPS,
    GETALLUTIL,
    UtilProfix
} from '../../../utils/const/index';
import { sep } from 'path';
import createUtil from '../utils/createUtil';
import stringify from '../utils/stringify';
import type SocketBase from '../../../utils/socket/SockeBase';
import type { ChildProcess } from 'child_process';

export default ({
    virtual_util,
    server,
    viteServer
}: {
    virtual_util: Map<string, Util>;
    server: SocketBase;
    viteServer: ChildProcess;
}) => {
    ipcMain.on(
        UPDATECOMMONUTILS,
        (
            event,
            {
                id,
                source,
                update
            }: { id: string; source: string; update?: boolean }
        ) => {
            const exist = virtual_util.has(id);
            if (update) {
                if (!exist) {
                    event.reply(TIPS, 'not found. please retry');
                    return;
                }
            } else {
                if (exist) {
                    event.reply(
                        TIPS,
                        'duplicate name util, please check and retry!'
                    );
                    return;
                }
            }
            virtual_util.set(id, createUtil({ path: id, source }));
            server.send('getUtil', stringify(virtual_util));
            viteServer.send(`${UtilProfix}${sep}${id}`);

            event.reply(
                GETALLUTIL,
                [...virtual_util.values()].map((vm) => vm.path)
            );
        }
    );
};
