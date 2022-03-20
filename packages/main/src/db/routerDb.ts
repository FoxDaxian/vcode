import Base from './base';
import type { RouterConfig_Set } from './base';
import { set2str } from '../utils/d2s';

export class RouterDb<T extends RouterConfig_Set> extends Base<T> {
    constructor(d: T) {
        super(d, 'routerDb.json');
    }
    stringify() {
        return set2str(this.d);
    }
    async stringifyFile() {
        const data = await this.getData();
        const set = new Set<RouterConfig>();
        data?.d?.forEach((_) => set.add(_));
        return set2str(set);
    }
}
