interface Info {
    pos: number[];
    id: string;
    updateSelf: boolean;
    prepend: boolean;
    source: string;
    child: string;
}

// VirtualModule
interface Vm {
    path: string;
    source: string;
    childComponent?: Vm[];
}
