import { returnError } from './shared';

export default function processState(instance) {
    const type = instance.type;
    const props = type.props;
    const getters = type.vuex && type.vuex.getters;
    const computedDefs = type.computed;

    const data = {
        ...instance.data,
        ...instance.renderContext
    };

    return Object.keys(data)
        .filter(
            (key) =>
                !(props && key in props) &&
                !(getters && key in getters) &&
                !(computedDefs && key in computedDefs)
        )
        .map((key) => ({
            key,
            type: 'data',
            value: returnError(() => data[key]),
            editable: true
        }));
}
