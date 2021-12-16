import { createServer } from 'vite';
import path from 'path';

const viteDevServerPromise = createServer({
    configFile: path.join(process.cwd(), 'packages/renderer/vite.config.js')
});

viteDevServerPromise.then(async (server) => {
    await server.listen();
    const protocol = `http${server.config.server.https ? 's' : ''}:`;
    const host = server.config.server.host || 'localhost';
    const port = server.config.server.port; // Vite searches for and occupies the first free port: 3000, 3001, 3002 and so on
    const path = '/';
    process.send({
        type: 'listening',
        payload: {
            url: `${protocol}//${host}:${port}${path}`
        }
    });
});
process.on('message', (msg) => {
    // 看来得再实现一遍vite的文件更新逻辑了，日。。。
    // 要么就放file里，但是感觉不太好
    // socket有的可以一对一，有的可以一对多

    // viteDevServerPromise.onFileChange(file);

    // if (viteDevServerPromise.config.hmr !== false) {
    //     try {
    //         await handleHMRUpdate(file, server);
    //     } catch (err) {
    //         ws.send({
    //             type: 'error',
    //             err: prepareError(err)
    //         });
    //     }
    // }
    console.log(msg, '===');
});
