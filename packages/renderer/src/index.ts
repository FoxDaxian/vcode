import { createApp } from 'vue';
import App from '@/App.vue';
import router from './router';
import Editor from '@/components/editor/index';
import 'element-plus/dist/index.css';

createApp(App).use(router).use(Editor).mount('#app');
