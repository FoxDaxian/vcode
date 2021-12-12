interface Info {
    pos: number[];
    id: string;
    source: string;
    child: string;
}

// VirtualModule
interface Vm {
    path: string;
    source: string;
    childComponent?: Vm[];
}
