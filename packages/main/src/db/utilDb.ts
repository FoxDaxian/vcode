import Base from './base';
import type { Util_Map } from './base';
import { map2str } from '../utils/d2s';

export class UtilDb<T extends Util_Map> extends Base<T> {
    constructor(d: T) {
        super(d, 'utilDb.json');
    }
    stringify() {
        return map2str(this.d);
    }
    async stringifyFile() {
        const data = await this.getData();
        const map = new Map();
        data?.d?.forEach((_) => map.set(..._));
        return map2str(map);
    }
}
