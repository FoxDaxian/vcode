import { returnError } from './shared';

export default function processComputed(instance, mergedType) {
    const type = mergedType;
    const computed = [];
    const defs = type.computed || {};
    // use for...in here because if 'computed' is not defined
    // on component, computed properties will be placed in prototype
    // and Object.keys does not include
    // properties from object's prototype
    for (const key in defs) {
        const def = defs[key];
        const type =
            typeof def === 'function' && def.vuex
                ? 'vuex bindings'
                : 'computed';
        computed.push({
            type,
            key,
            value: returnError(() => instance.proxy[key]),
            editable: typeof def.set === 'function'
        });
    }

    return computed;
}
