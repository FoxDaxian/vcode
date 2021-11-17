import { ContextBridge } from 'electron';
import { ElectronApi } from '@/types/electron-api';

const apiKey = 'electron';
/**
 * @see https://github.com/electron/electron/issues/21437#issuecomment-573522360
 */
const api: ElectronApi = {
    type: process.type,
    versions: process.versions
};

export default (contextBridge: ContextBridge) => {
    /**
     * The "Main World" is the JavaScript context that your main renderer code runs in.
     * By default, the page you load in your renderer executes code in this world.
     *
     * @see https://www.electronjs.org/docs/api/context-bridge
     */

    contextBridge.exposeInMainWorld(apiKey, api);
};
