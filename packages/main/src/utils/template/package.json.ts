import { writeFileSync } from 'fs';
import { join } from 'path';
const temp = () => {
    return `{
    "name": "vcode-project",
    "private": true,
    "version": "0.0.0",
    "scripts": {
        "dev": "vite",
        "build": "vue-tsc --noEmit && vite build",
        "preview": "vite preview"
    },
    "dependencies": {
        "vue": "^3.2.25"
    },
    "devDependencies": {
        "@vitejs/plugin-vue": "^2.2.0",
        "typescript": "^4.5.4",
        "vite": "^2.8.0",
        "vue-tsc": "^0.29.8"
    }
}    
`;
};

export default (basePath: string) => {
    writeFileSync(join(basePath, 'package.json'), temp());
};
