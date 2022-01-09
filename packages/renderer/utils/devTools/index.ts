import { resolveMergedOptions } from './shared';
import processSetupState from './processSetupState';
import processProps from './processProps';
import processState from './processState';
import processComputed from './processComputed';
import processAttrs from './processAttrs';
import processProvide from './processProvide';
import processInject from './processInject';
import processRefs from './processRefs';

export function getInstanceState(instance: any) {
    const mergedType = resolveMergedOptions(instance);
    return processProps(instance).concat(
        processState(instance),
        processSetupState(instance),
        processComputed(instance, mergedType),
        processAttrs(instance),
        processProvide(instance),
        processInject(instance, mergedType),
        processRefs(instance)
    );
}
