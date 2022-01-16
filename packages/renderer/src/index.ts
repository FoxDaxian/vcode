import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import Editor from '@/components/editor/index';
import Contextmenu from '@/components/contextmenu/index';
import 'element-plus/dist/index.css';
import {
    ArrowRight,
    ArrowLeft,
    ArrowDown,
    ArrowUp,
    Minus,
    Plus
} from '@element-plus/icons-vue';

createApp(App as any)
    .component('ArrowRight', ArrowRight)
    .component('ArrowLeft', ArrowLeft)
    .component('ArrowDown', ArrowDown)
    .component('ArrowUp', ArrowUp)
    .component('Minus', Minus)
    .component('Plus', Plus)
    .use(router)
    .use(Editor)
    .use(Contextmenu)
    .mount('#app');
