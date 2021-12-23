declare interface Info {
    pos: number[];
    id: string;
    updateSelf: boolean;
    prepend?: boolean;
    source: string;
    child: string;
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
