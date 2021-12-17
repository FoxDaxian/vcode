import net from 'net';
import Socketbase from './SockeBase';
import Stick from './Stick';

const stick = new Stick();

// https://juejin.cn/post/7016233869565231135 how to communicate in two server
// https://github.com/kyriosli/node-shared-cache memory share for communication
// 消息队列 信号量（pcb块） 管道（命名|匿名） 共享内存

export default class extends Socketbase {
    constructor() {
        super();
        this.server = net.createServer((c) => {
            this.send = (channel, data) => {
                c.write(stick.makeData(JSON.stringify({ channel, data })));
            };
            console.log('socket server started');
            c.on('error', (err) => console.error(err));
            c.on('close', () => {
                console.log('disconnected');
            });
            c.on('data', (info) => {
                stick.receiveData(info, (buf) => {
                    const { channel, data } = JSON.parse(buf.toString());
                    this.events.get(channel)?.forEach((cb) => cb(data));
                });
            });
            // 这个方法的解释：https://stackoverflow.com/questions/20085513/using-pipe-in-node-js-net
            // 其实就是实现了上面的on data，不过是直接发送收到的内容，这里需要注掉，实现自己的pipe
            // c.pipe(c);
        });
    }
    // eslint-disable-next-line
    send(channel, data) {
        /** */
    }
    connect() {
        this._unlink();
        return new Promise((res) => {
            this.server.listen(this.pipeFile, () => {
                res();
            });
        });
    }
    on(channel, cb) {
        this.events.set(
            channel,
            (this.events.get(channel) || new Set()).add(cb)
        );
    }
}
