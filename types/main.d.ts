interface Info {
    id: string;
    child: string;
    source: string;
}

// VirtualModule
interface Vm {
    path: string;
    source: string;
    childComponent?: Vm[];
}
