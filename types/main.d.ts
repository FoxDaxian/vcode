declare interface Info {
    pos: number[];
    id: string;
    updateSelf: boolean;
    prepend?: boolean;
    source: string;
    child: string; // 拖拽式添加的时候是path，其他情况是新增的子组件名
    insertOrNew?: string;
    parentRoutePath?: string;
    routePath?: string;
    routeName?: string;
}

declare interface RouteInfo {
    source: string;
    child: string;
    insertOrNew?: string;
    parentRoutePath?: string;
    routePath?: string;
    routeName?: string;
}

declare const PAGEPATH: string;
declare const ROOTCOM: string;

// VirtualModule
declare interface Vm {
    path: string;
    source: string;
    childComponent?: Map<string, Vm>;
}

declare interface Util {
    path: string;
    source: string;
    childComponent?: Map<string, Vm>;
}
