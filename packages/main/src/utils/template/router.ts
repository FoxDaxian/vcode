import MagicString from 'magic-string';
import { setSpace } from '../commonCh';
import { join } from 'path';
import { writeFileSync } from 'fs';
import { set2str } from '../d2s';

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
    writeFileSync(join(routerPath, 'index.ts'), temp(set2str(routerConfig)));
};
