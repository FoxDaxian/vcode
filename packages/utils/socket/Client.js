import net from 'net';
import SocketBase from './SockeBase';
import Stick from './Stick';

const stick = new Stick();

export default class extends SocketBase {
    constructor() {
        super();
    }
    connect() {
        return new Promise((res) => {
            this.client = net.connect(this.pipeFile, () => {
                console.log('socket client connect success');
                res();
            });
            this.client.on('data', (info) => {
                stick.receiveData(info, (buf) => {
                    const { channel, data } = JSON.parse(buf.toString());
                    this.events.get(channel)?.forEach((cb) => cb(data));
                });
            });
        });
    }
    send(channel, data) {
        this.client.write(stick.makeData(JSON.stringify({ channel, data })));
    }
    on(channel, cb) {
        this.events.set(
            channel,
            (this.events.get(channel) || new Set()).add(cb)
        );
    }
}
