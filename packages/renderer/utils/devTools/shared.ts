export function returnError(cb: () => any) {
    try {
        return cb();
    } catch (e) {
        return e;
    }
}

export function isRef(raw: any): boolean {
    return !!raw.__v_isRef;
}

export function isComputed(raw: any): boolean {
    return isRef(raw) && !!raw.effect;
}

export function isReactive(raw: any): boolean {
    return !!raw.__v_isReactive;
}

export function isReadOnly(raw: any): boolean {
    return !!raw.__v_isReadonly;
}

function cached(fn) {
    const cache = Object.create(null);
    return function cachedFn(str) {
        const hit = cache[str];
        return hit || (cache[str] = fn(str));
    };
}
function toUpper(_, c) {
    return c ? c.toUpperCase() : '';
}
const camelizeRE = /-(\w)/g;
export const camelize = cached((str) => {
    return str && str.replace(camelizeRE, toUpper);
});

function mergeOptions(to: any, from: any, instance: any) {
    if (typeof from === 'function') {
        from = from.options;
    }

    if (!from) return to;

    const { mixins, extends: extendsOptions } = from;

    extendsOptions && mergeOptions(to, extendsOptions, instance);
    mixins && mixins.forEach((m) => mergeOptions(to, m, instance));

    for (const key of ['computed', 'inject']) {
        if (Object.prototype.hasOwnProperty.call(from, key)) {
            if (!to[key]) {
                to[key] = from[key];
            } else {
                Object.assign(to[key], from[key]);
            }
        }
    }
    return to;
}

export function resolveMergedOptions(instance: any) {
    const raw = instance.type;
    const { mixins, extends: extendsOptions } = raw;
    const globalMixins = instance.appContext.mixins;
    if (!globalMixins.length && !mixins && !extendsOptions) return raw;
    const options = {};
    globalMixins.forEach((m) => mergeOptions(options, m, instance));
    mergeOptions(options, raw, instance);
    return options;
}
