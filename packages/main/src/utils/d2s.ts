import MagicString from 'magic-string';
import { setSpace } from './commonCh';

export const set2str = (data: Set<RouterConfig>) => {
    const str = new MagicString('[]');
    // [{}]
    [...data].forEach((item) => {
        str.appendRight(1, `\n${setSpace(1)}{`);
        for (const [k, v] of Object.entries(item)) {
            const val =
                k === 'component'
                    ? `() => import('${v.replace(/^\/src/, '..')}')`
                    : `'${v}'`;
            str.appendRight(1, `\n${setSpace(2)}${k}: ${val},`);
        }
        str.appendRight(1, `\n${setSpace(1)}},\n`);
    });

    return str.toString();
};
const backquote = '`';

export function map2str(data: Map<string, Vm | Util>) {
    const str = new MagicString('[]');
    [...data].forEach((item) => {
        str.appendRight(1, `\n${setSpace(1)}[`); // 里面每一项都是数组

        str.appendRight(1, `\n${setSpace(2)}'${item[0]}',`); // 数组第一项是字符串

        str.appendRight(1, `\n${setSpace(2)}{`); // 之后是对象

        for (const [k, v] of Object.entries(item[1])) {
            const val =
                k === 'childComponent'
                    ? `${map2str(v)}`
                    : k === 'source'
                        ? `${backquote}${v}${backquote}`
                        : `'${v}'`;
            str.appendRight(1, `\n${setSpace(3)}${k}: ${val},`);
        }
        str.appendRight(1, `\n${setSpace(2)}}\n`);

        str.appendRight(1, `${setSpace(1)}],\n`);
    });
    return str.toString();
}
