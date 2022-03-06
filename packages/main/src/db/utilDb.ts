import Base from './base';
import type { Util_Map } from './base';
import { map2str } from '../utils/d2s';

export class UtilDb<T extends Util_Map> extends Base<T> {
    constructor(d: T) {
        super(d, 'utilDb.json');
    }
    _toString() {
        return map2str(this.d);
    }
}
