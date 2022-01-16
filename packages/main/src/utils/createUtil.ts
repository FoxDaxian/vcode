export default (vmInfo: Util): Util => {
    return {
        path: vmInfo.path,
        source: vmInfo.source,
        childComponent: vmInfo.childComponent ?? new Map()
    };
};
