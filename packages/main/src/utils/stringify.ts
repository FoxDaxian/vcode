export default (data: Map<string, Vm>) => JSON.stringify(data, replacer);

function replacer(key: any, value: any) {
    if (value instanceof Map) {
        return [...value].reduce(
            (obj, [k, v]) => Object.assign(obj, { [k]: v }),
            {}
        );
    } else {
        return value;
    }
}
