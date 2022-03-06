import Base from './base';
import type { Vm_Map } from './base';
import { map2str } from '../utils/d2s';

export class ModuleDb<T extends Vm_Map> extends Base<T> {
    constructor(d: T) {
        super(d, 'moduleDb.json');
    }
    _toString() {
        return map2str(this.d);
    }
}
