import { ipcMain } from 'electron';
import { FRESHCACHE, PROCESSFRESHCACHE } from '../../../utils/const/index';
import type { ChildProcess } from 'child_process';

export default ({ viteServer }: { viteServer: ChildProcess }) => {
    ipcMain.on(FRESHCACHE, (event, { id }) => {
        viteServer.send(`${PROCESSFRESHCACHE}${id}`);
    });
};
