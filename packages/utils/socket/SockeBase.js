import { unlinkSync } from 'fs';

export default class {
    events = new Map();
    pipeFile =
        process.platform === 'win32' ? '\\\\.\\pipe\\mypip' : '/tmp/unix.sock';
    constructor() {
        //
    }
    _unlink() {
        try {
            unlinkSync(this.pipeFile);
        } catch (error) {
            // console.log(error, '===');
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
