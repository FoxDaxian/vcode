import { unlinkSync } from 'fs';
import net from 'net';

// https://juejin.cn/post/7016233869565231135 how to communicate in two server
// https://github.com/kyriosli/node-shared-cache memory share for communication
// 消息队列 信号量（pcb块） 管道（命名|匿名） 共享内存
class SocketBase {
    events = new Map();
    pipeFile =
        process.platform === 'win32' ? '\\\\.\\pipe\\mypip' : '/tmp/unix.sock';
    constructor() {
        //
    }
    unlink() {
        try {
            unlinkSync(this.pipeFile);
        } catch (error) {
            console.log(error, '===');
            /* */
        }
    }

    connect() {
        console.log('please override connect');
    }
    send() {
        console.log('please override send');
    }
    on() {
        console.log('please override on');
    }
}

export class Server extends SocketBase {
    constructor() {
        super();
        this.server = net.createServer((c) => {
            this.send = (channel, data) => {
                c.write(JSON.stringify({ channel, data }));
            };
            console.log('connected');
            c.on('error', (err) => console.error(err));
            c.on('close', () => {
                console.log('disconnected');
            });
            c.on('data', (info) => {
                const { channel, data } = JSON.parse(info);
                this.events.get(channel)?.forEach((cb) => cb(data));
            });
            c.pipe(c);
        });
    }
    connect() {
        this.unlink();
        return new Promise((res) => {
            this.server.listen(this.pipeFile, () => {
                res();
            });
        });
    }
    send() {
        /** */
    }
    on(channel, cb) {
        this.events.set(
            channel,
            (this.events.get(channel) || new Set()).add(cb)
        );
    }
}

export class Client extends SocketBase {
    constructor() {
        super();
    }
    connect() {
        this.client = net.connect(this.pipeFile);
        this.client.on('data', (info) => {
            const { channel, data } = JSON.parse(info);
            this.events.get(channel)?.forEach((cb) => cb(data));
        });
    }
    send(channel, data) {
        this.client.write(JSON.stringify({ channel, data }));
    }
    on(channel, cb) {
        this.events.set(
            channel,
            (this.events.get(channel) || new Set()).add(cb)
        );
    }
}
