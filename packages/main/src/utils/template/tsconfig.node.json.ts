import { writeFileSync } from 'fs';
import { join } from 'path';

const temp = () => {
    return `{
    "compilerOptions": {
        "composite": true,
        "module": "esnext",
        "moduleResolution": "node"
    },
    "include": ["vite.config.ts"]
}
`;
};

export default (basePath: string) => {
    writeFileSync(join(basePath, 'tsconfig.node.json'), temp());
};
