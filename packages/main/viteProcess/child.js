import { PROCESSFRESHCACHE } from '../../utils/const/index';
import { createServer } from 'vite';
import path from 'path';

const cssLangs = '\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)';
const cssLangRE = new RegExp(cssLangs);
const isCSSRequest = (request) => cssLangRE.test(request);

const viteDevServerPromise = createServer({
    configFile: path.join(process.cwd(), 'packages/renderer/vite.config.js')
});

viteDevServerPromise.then(async (server) => {
    await server.listen();
    // 虚拟文件，手动更新视图

    process.on('message', async (vmPath) => {
        switch (true) {
            case vmPath.startsWith(PROCESSFRESHCACHE):
                freshCache(vmPath, server);
                break;
            default:
                hmr(vmPath, server);
                break;
        }
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

function freshCache(vmPath, server) {
    server.moduleGraph.urlToModuleMap.delete(
        vmPath.replace(PROCESSFRESHCACHE, '')
    );
}

function invalidate(mod, timestamp, seen) {
    if (seen.has(mod)) {
        return;
    }
    seen.add(mod);
    mod.lastHMRTimestamp = timestamp;
    mod.transformResult = null;
    mod.ssrModule = null;
    mod.ssrTransformResult = null;
    mod.importers.forEach((importer) => {
        // 更新引入和这个模块的importers
        if (!importer.acceptedHmrDeps.has(mod)) {
            invalidate(importer, timestamp, seen);
        }
    });
}
function hmr(vmPath, server) {
    const modules = server.moduleGraph.getModulesByFile(vmPath);
    if (!modules) {
        return;
    }
    let needFullReload = false;
    const updates = [];
    const invalidatedModules = new Set();
    const timestamp = Date.now();

    for (const mod of modules) {
        invalidate(mod, timestamp, invalidatedModules);
        if (needFullReload) {
            continue;
        }

        const boundaries = new Set();
        const hasDeadEnd = propagateUpdate(mod, boundaries);
        if (hasDeadEnd) {
            continue;
        }

        updates.push(
            ...[...boundaries].map(({ boundary, acceptedVia }) => ({
                type: `${boundary.type}-update`,
                timestamp,
                path: boundary.url,
                acceptedPath: acceptedVia.url
            }))
        );
    }

    server.moduleGraph.onFileChange(vmPath);

    server.ws.send({
        type: 'update',
        updates
    });
}

// TODO：目前是修改css也会更新js，待优化
function propagateUpdate(node, boundaries, currentChain = [node]) {
    if (node.isSelfAccepting) {
        boundaries.add({
            boundary: node,
            acceptedVia: node
        });

        // additionally check for CSS importers, since a PostCSS plugin like
        // Tailwind JIT may register any file as a dependency to a CSS file.
        for (const importer of node.importers) {
            if (
                isCSSRequest(importer.url) &&
                !currentChain.includes(importer)
            ) {
                propagateUpdate(
                    importer,
                    boundaries,
                    currentChain.concat(importer)
                );
            }
        }

        return false;
    }

    if (!node.importers.size) {
        return true;
    }

    // #3716, #3913
    // For a non-CSS file, if all of its importers are CSS files (registered via
    // PostCSS plugins) it should be considered a dead end and force full reload.
    if (
        !isCSSRequest(node.url) &&
        [...node.importers].every((i) => isCSSRequest(i.url))
    ) {
        return true;
    }

    for (const importer of node.importers) {
        const subChain = currentChain.concat(importer);
        if (importer.acceptedHmrDeps.has(node)) {
            boundaries.add({
                boundary: importer,
                acceptedVia: node
            });
            continue;
        }

        if (currentChain.includes(importer)) {
            // circular deps is considered dead end
            return true;
        }

        if (propagateUpdate(importer, boundaries, subChain)) {
            return true;
        }
    }
    return false;
}
