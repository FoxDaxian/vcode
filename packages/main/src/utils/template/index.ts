import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import renderRouter from './router';
import renderHtml from './index.html';
import renderMain from './main.ts';
import renderPkb from './package.json';
import renderMd from './README.md';
import renderTsconf from './tsconfig.json';
import renderTsconfNode from './tsconfig.node.json';
import renderVite from './vite.config.ts';
import gitignore from './gitignore';
import { getBuildOutputPath } from '../path';

export default ({
    virtual_module,
    virtual_util,
    routerConfig
}: {
    virtual_module: Map<string, Vm>;
    virtual_util: Map<string, Util>;
    routerConfig: Set<RouterConfig>;
}) => {
    const { basePath, srcPath, componentsPath, utilsPath, routerPath } =
        getBuildOutputPath();
    [componentsPath, utilsPath, routerPath].forEach((p) => {
        if (!existsSync(p)) {
            mkdirSync(p, { recursive: true });
        }
    });
    for (const [_, vm] of virtual_module.entries()) {
        writeFileSync(join(basePath, vm.path), vm.source);
    }
    for (const [_, util] of virtual_util.entries()) {
        writeFileSync(join(utilsPath, `${util.path}.ts`), util.source);
    }

    renderRouter(routerConfig, routerPath);
    renderHtml(basePath);
    renderMain(srcPath);
    renderPkb(basePath);
    renderMd(basePath);
    renderTsconf(basePath);
    renderTsconfNode(basePath);
    renderVite(basePath);
    gitignore(basePath);
};
