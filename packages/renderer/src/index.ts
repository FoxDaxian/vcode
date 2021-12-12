import { createApp } from 'vue';
import App from '@/App.vue';
import router from './router';
import Editor from '@/components/editor/index';

createApp(App).use(router).use(Editor).mount('#app');
