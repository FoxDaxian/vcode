import {
    isRef,
    isComputed,
    isReactive,
    isReadOnly,
    returnError
} from './shared';

function getSetupStateInfo(raw: any) {
    return {
        ref: isRef(raw),
        computed: isComputed(raw),
        reactive: isReactive(raw),
        readonly: isReadOnly(raw)
    };
}

export default function processSetupState(instance: any) {
    const raw = instance.devtoolsRawSetupState || {};
    return Object.keys(instance.setupState).map((key) => {
        const value = returnError(() => instance.setupState[key]);
        const rawData = raw[key];

        let result: any;

        if (rawData) {
            const info = getSetupStateInfo(rawData);

            const objectType = info.computed
                ? 'Computed'
                : info.ref
                    ? 'Ref'
                    : info.reactive
                        ? 'Reactive'
                        : null;
            const isState = info.ref || info.computed || info.reactive;
            const isOther =
                typeof value === 'function' ||
                typeof value?.render === 'function';
            const raw =
                rawData.effect?.raw?.toString() ||
                rawData.effect?.fn?.toString();

            result = {
                ...(objectType ? { objectType } : {}),
                ...(raw ? { raw } : {}),
                editable: isState && !info.readonly,
                type: isOther ? 'setup (other)' : 'setup'
            };
        } else {
            result = {
                type: 'setup'
            };
        }

        return {
            key,
            value,
            ...result
        };
    });
}
