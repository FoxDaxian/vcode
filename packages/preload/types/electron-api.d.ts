export interface ElectronApi {
    readonly versions: Readonly<NodeJS.ProcessVersions>;
    readonly type: Readonly<string>;
}

declare interface Window {
    electron: Readonly<ElectronApi>;
    electronRequire?: NodeRequire;
}
