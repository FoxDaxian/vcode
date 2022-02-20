import { writeFileSync } from 'fs';
import { join } from 'path';

const temp = () => {
    return `<!DOCTYPE html>
<html lang="en">
    <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
    </head>
    <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
    </body>
</html>
        
`;
};

export default (basePath: string) => {
    writeFileSync(join(basePath, 'index.html'), temp());
};
