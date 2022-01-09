import type { ContextBridge } from 'electron';
import * as path from 'path';

const root = path.resolve(__dirname, '../../../');
const packages = path.join(root, './packages');

const apiKey = 'path';
const api = {
    sep: path.sep,
    root,
    packages,
    renderer: path.join(packages, 'renderer')
};

export default (contextBridge: ContextBridge) => {
    contextBridge.exposeInMainWorld(apiKey, api);
};
