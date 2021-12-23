import { createRouter, createWebHashHistory } from 'vue-router';
// 组件一个目录
// 页面一个目录

const routes = [
    {
        path: '/',
        name: 'mainContent',
        component: () => import(/* @vite-ignore */ ROOTCOM)
    }
];
const router = createRouter({
    routes,
    history: createWebHashHistory()
});

router.beforeEach(async (to, from, next) => {
    next();
});

export default router;
