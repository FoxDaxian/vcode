import { writeFileSync } from 'fs';
import { join } from 'path';

const temp = () => {
    return `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()]
})
`;
};

export default (basePath: string) => {
    writeFileSync(join(basePath, 'vite.config.ts'), temp());
};
