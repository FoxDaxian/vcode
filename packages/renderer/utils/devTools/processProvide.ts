import { returnError } from './shared';

export default function processProvide(instance) {
    return Object.keys(instance.provides).map((key) => ({
        type: 'provided',
        key,
        value: returnError(() => instance.provides[key])
    }));
}
