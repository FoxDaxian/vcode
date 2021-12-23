export default (vmInfo: Vm): Vm => {
    return {
        path: vmInfo.path,
        source: vmInfo.source,
        childComponent: vmInfo.childComponent ?? new Map()
    };
};
