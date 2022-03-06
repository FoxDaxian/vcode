import Base from './base';
import type { RouterConfig_Set } from './base';
import { set2str } from '../utils/d2s';

export class RouterDb<T extends RouterConfig_Set> extends Base<T> {
    constructor(d: T) {
        super(d, 'routerDb.json');
    }
    _toString() {
        return set2str(this.d);
    }
}
