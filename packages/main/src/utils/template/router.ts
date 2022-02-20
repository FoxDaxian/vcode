import MagicString from 'magic-string';
import { setSpace } from '../commonCh';
import { join } from 'path';
import { writeFileSync } from 'fs';

const temp = (routes: string) => {
    return `import { createRouter, createWebHashHistory } from 'vue-router';

const routes = ${routes || []};
const router = createRouter({
    routes,
    history: createWebHashHistory()
});

router.beforeEach(async (to, from, next) => {
    next();
});

export default router;
`;
};

export default (routerConfig: Set<RouterConfig>, routerPath: string) => {
    const rcStr = new MagicString('[]');
    Array.from(routerConfig).forEach((item) => {
        rcStr.appendRight(1, `\n${setSpace(1)}{`);
        for (const [k, v] of Object.entries(item)) {
            const val =
                k === 'component'
                    ? `() => import('${v.replace(/^\/src/, '..')}')`
                    : `'${v}'`;
            rcStr.appendRight(1, `\n${setSpace(2)}${k}: ${val},`);
        }
        rcStr.appendRight(1, `\n${setSpace(1)}},\n`);
    });

    writeFileSync(join(routerPath, 'index.ts'), temp(rcStr.toString()));
};
