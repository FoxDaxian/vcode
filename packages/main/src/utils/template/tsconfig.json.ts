import { writeFileSync } from 'fs';
import { join } from 'path';
const temp = () => {
    return `{
    "compilerOptions": {
        "target": "esnext",
        "useDefineForClassFields": true,
        "module": "esnext",
        "moduleResolution": "node",
        "strict": true,
        "jsx": "preserve",
        "sourceMap": true,
        "resolveJsonModule": true,
        "esModuleInterop": true,
        "lib": [
        "esnext",
        "dom"
        ]
    },
    "include": [
        "src/**/*.ts",
        "src/**/*.d.ts",
        "src/**/*.tsx",
        "src/**/*.vue"
    ],
    "references": [
        {
        "path": "./tsconfig.node.json"
        }
    ]
}
`;
};

export default (basePath: string) => {
    writeFileSync(join(basePath, 'tsconfig.json'), temp());
};
