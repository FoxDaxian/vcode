import { createRouter, createWebHashHistory } from 'vue-router';
import mainContent from '/@/components/layout/mainContent.vue';

const routes = [
    {
        path: '/',
        name: 'mainContent',
        component: mainContent,
    },
];

export default createRouter({
    routes,
    history: createWebHashHistory(),
});
