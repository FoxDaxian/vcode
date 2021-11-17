import { createRouter, createWebHashHistory } from 'vue-router';
import mainContent from '@/components/mainContent.vue';

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
