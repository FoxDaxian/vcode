import { createRouter, createWebHashHistory } from 'vue-router';
// 组件一个目录
// 页面一个目录

const routes = [
    {
        path: '/',
        name: 'mainContent',
        component: () => import(/* @vite-ignore */ ROOTCOM)
        // component: () => import('./page/t.vue')
    }
];
const router = createRouter({
    routes,
    history: createWebHashHistory()
});

router.beforeEach(async (to, from, next) => {
    if (!to.matched.length) {
        next('/');
    }
    next()
});

export default router;
