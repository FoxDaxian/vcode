declare interface Info {
    pos: number[];
    id: string;
    updateSelf: boolean;
    prepend?: boolean;
    source: string;
    child: string; // 拖拽式添加的时候是path，其他情况是新增的子组件名
    isModifyRoute?: boolean;
    parentRoutePath?: string;
    routePath?: string;
    routeName?: string;
}

declare interface RouteInfo {
    source: string;
    child: string;
    isModifyRoute: boolean;
    parentRoutePath: string;
    routePath: string;
    routeName: string;
}

declare const PAGEPATH: string;
declare const ROOTCOM: string;

// VirtualModule
declare interface Vm {
    path: string;
    source: string;
    childComponent?: Map<string, Vm>;
}

declare interface RouterConfig {
    path: string;
    name: string;
    component: string;
}

declare interface Util {
    path: string;
    source: string;
    childComponent?: Map<string, Vm>;
}
