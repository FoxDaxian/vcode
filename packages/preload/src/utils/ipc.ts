import type { ContextBridge, IpcRendererEvent } from 'electron';
import { ipcRenderer } from 'electron';

const apiKey = 'ipc';
const api = {
    on(
        channel: string,
        listener: (event: IpcRendererEvent, ...args: any[]) => void
    ) {
        ipcRenderer.on(channel, listener);
    },
    send(channel: string, ...args: any[]) {
        ipcRenderer.send(channel, ...args);
    }
};

export default (contextBridge: ContextBridge) => {
    contextBridge.exposeInMainWorld(apiKey, api);
};
