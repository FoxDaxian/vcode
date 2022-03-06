import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Low, JSONFile } from 'lowdb';
import { getBasePath } from '../utils/path';

export type Vm_Map = Map<string, Vm>;
export type Util_Map = Map<string, Util>;
export type RouterConfig_Set = Set<RouterConfig>;

export type VM_Arr = MapOrSet2Arr<Vm_Map>;
export type Util_Arr = MapOrSet2Arr<Util_Map>;
export type RouterConfig_Arr = MapOrSet2Arr<RouterConfig_Set>;

export type MapOrSet2Arr<T> = T extends Map<string, infer VmOrUtil>
    ? [string, VmOrUtil][]
    : T extends Set<infer Rc>
    ? Rc[]
    : unknown[];

export type DataOrigin = Vm_Map | Util_Map | RouterConfig_Set;
type Json<T> = { d?: T };

export interface DB<T> {
    collect(): void;
    _toString(): string;
    getData(): Promise<Json<T> | null>;
    writeData(d: DataOrigin): Promise<void>;
}

export default class Base<T extends DataOrigin> implements DB<MapOrSet2Arr<T>> {
    private initCompleted = false;
    d: T;
    private basePath = getBasePath();
    private dbFile = '';
    protected db;
    constructor(d: T, file: string) {
        this.ensureBasePath();
        this.d = d;
        this.db = this.init(file);
        this.db.read().then(async () => {
            this.db.data = this.db.data || {};
            await this.db.write();
            this.initCompleted = true;
        });

        // this.autoCollect(10 * 1000);
    }

    // diff
    _toString() {
        return '';
    }

    private init(file: string) {
        this.dbFile = join(getBasePath(), file);
        const adapter = new JSONFile<Json<MapOrSet2Arr<T>>>(this.dbFile);
        return new Low(adapter);
    }

    private ensureBasePath() {
        if (!existsSync(this.basePath)) {
            mkdirSync(this.basePath);
        }
    }

    collect() {
        this.writeData(this.d);
    }

    private autoCollect(times: number) {
        console.log(this._toString.toString());
        // 十分钟，至少1000个改变，才会更新数据库
        // map2str, set2str 利用这俩搞比对
    }

    getData() {
        return new Promise<Json<MapOrSet2Arr<T>> | null>((res) => {
            if (this.initCompleted) {
                res(this.db.data);
                return;
            }
            process.nextTick(() => {
                res(this.getData());
            });
        });
    }
    writeData(d: T) {
        if (!this.db.data) {
            return Promise.resolve();
        }
        this.db.data = {
            d: [...d] as MapOrSet2Arr<T>
        };
        return this.db.write();
    }
}
