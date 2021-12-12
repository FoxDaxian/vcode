const { createServer } = require('vite');
const path = require('path');
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
