import { returnError } from './shared';

export default function processAttrs(instance) {
    if (instance.type.__file === ROOTCOM) {
        return [];
    }
    return Object.keys(instance.attrs).map((key) => ({
        type: 'attrs',
        key,
        value: returnError(() => instance.attrs[key])
    }));
}
