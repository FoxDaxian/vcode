import { join } from 'path';

// common path
export const root = join(__dirname, '../../../');

// vite child process path
export const viteProcessPath = join(root, 'packages/main/viteProcess/child.js');

// build output path
export const getBasePath = () => join(root, 'source');

export const getBuildOutputPath = () => {
    const basePath = getBasePath();
    const srcPath = join(basePath, 'src');
    return {
        basePath,
        srcPath,
        componentsPath: join(srcPath, 'components'),
        utilsPath: join(srcPath, 'utils'),
        routerPath: join(srcPath, 'router')
    };
};
