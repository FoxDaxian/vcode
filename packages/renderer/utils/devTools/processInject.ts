import { returnError } from './shared';

export default function processInject(instance, mergedType) {
    if (!mergedType?.inject) return [];
    let keys = [];
    if (Array.isArray(mergedType.inject)) {
        keys = mergedType.inject.map((key) => ({
            key,
            originalKey: key
        }));
    } else {
        keys = Object.keys(mergedType.inject).map((key) => {
            const value = mergedType.inject[key];
            let originalKey;
            if (typeof value === 'string') {
                originalKey = value;
            } else {
                originalKey = value.from;
            }
            return {
                key,
                originalKey
            };
        });
    }
    return keys.map(({ key, originalKey }) => ({
        type: 'injected',
        key:
            originalKey && key !== originalKey
                ? `${originalKey} ➞ ${key}`
                : key,
        value: returnError(() => instance.ctx[key])
    }));
}
