import { writeFileSync } from 'fs';
import { join } from 'path';

const temp = () => {
    return `import { createApp } from 'vue'
import App from './components/mainContent.vue'
import router from './router/';

createApp(App).use(router).mount('#app')
`;
};

export default (srcPath: string) => {
    writeFileSync(join(srcPath, 'main.ts'), temp());
};
