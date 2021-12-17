import { createServer } from 'vite';
import path from 'path';

const viteDevServerPromise = createServer({
    configFile: path.join(process.cwd(), 'packages/renderer/vite.config.js')
});


viteDevServerPromise.then(async (server) => {
    await server.listen();
    // 虚拟文件，手动更新视图

    process.on('message', async (vmPath) => {
        // 看来得再实现一遍vite的文件更新逻辑了，日。。。
        // 要么就放file里，但是感觉不太好
        // socket有的可以一对一，有的可以一对多
        // moduleGraph


        // console.log(server.moduleGraph.fileToModulesMap.keys(), '==');
        // const mods = server.moduleGraph.getModulesByFile(vmPath);
        // if (!mods) {
        //     console.log('hmr更新失败，请重试');
        //     return;
        // }

        // mods.forEach(mod => server.moduleGraph.invalidateModule(mod));
        
        // 目前是简单粗暴地直接重启服务，还需要优化
        await server.restart();
    });
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
