import { returnError, camelize } from './shared';
// import { SharedData } from '@vue-devtools/shared-utils';

const fnTypeRE = /^(?:function|class) (\w+)/;
function getPropType(type: any): any {
    if (Array.isArray(type)) {
        return type.map((t) => getPropType(t)).join(' or ');
    }
    if (type == null) {
        return 'null';
    }
    const match = type.toString().match(fnTypeRE);
    return typeof type === 'function' ? (match && match[1]) || 'any' : 'any';
}
export default function processProps(instance: any) {
    const propsData = [];
    const propDefinitions = instance.type.props;

    for (let key in instance.props) {
        const propDefinition = propDefinitions ? propDefinitions[key] : null;
        key = camelize(key);
        propsData.push({
            type: 'props',
            key,
            value: returnError(() => instance.props[key]),
            meta: propDefinition
                ? {
                    type: propDefinition.type
                        ? getPropType(propDefinition.type)
                        : 'any',
                    required: !!propDefinition.required,
                    ...(propDefinition.default != null
                        ? {
                            default: propDefinition.default.toString()
                        }
                        : {})
                }
                : {
                    type: 'invalid'
                },
            editable: false
        });
    }
    return propsData;
}
