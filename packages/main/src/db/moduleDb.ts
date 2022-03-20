import Base from './base';
import type { Vm_Map } from './base';
import { map2str } from '../utils/d2s';

export class ModuleDb<T extends Vm_Map> extends Base<T> {
    constructor(d: T) {
        super(d, 'moduleDb.json');
    }
    stringify() {
        return map2str(this.d);
    }
    async stringifyFile() {
        const data = await this.getData();
        const map = new Map()
        data?.d?.forEach((_) => {
            _[1].childComponent = new Map();
            map.set(..._);
        });
        return map2str(map);
    }
}
