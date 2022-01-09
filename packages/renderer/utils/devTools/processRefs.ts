import { returnError } from './shared';

export default function processRefs(instance) {
    return Object.keys(instance.refs).map((key) => ({
        type: 'refs',
        key,
        value: returnError(() => instance.refs[key])
    }));
}
