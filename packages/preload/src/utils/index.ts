import type { ContextBridge } from 'electron';
import electronApiInit from './electronApi';
import pathInit from './path';
import ipcInit from './ipc';

const initList = [electronApiInit, pathInit, ipcInit];
export default (contextBridge: ContextBridge) => {
    initList.forEach((init) => init(contextBridge));
};
