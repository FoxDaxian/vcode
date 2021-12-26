import { ipcMain } from 'electron';
import createVm from '../utils/createVm';
import MagicString from 'magic-string';
import { join, parse } from 'path';
import stringify from '../utils/stringify';
import { writeFileSync, statSync } from 'fs';
import { parse as sfcParse } from '@vue/compiler-dom';
import { VmProfix, UpdateComponent } from '../../../utils/const/index';
import getAstPos from '../utils/getAstPos';
import type SocketBase from '../../../utils/socket/SockeBase';
import type { ChildProcess } from 'child_process';

export default ({
    virtual_module,
    server,
    viteServer
}: {
    virtual_module: Map<string, Vm>;
    server: SocketBase;
    viteServer: ChildProcess;
}) => {
    ipcMain.on(UpdateComponent, (event, info: Info) => {
        const { id, child, source, pos, updateSelf, prepend } = info;
        const parentVm: Vm = virtual_module.get(replaceVmPrefix(id))!;
        // 支持修改本身组件名
        if (updateSelf) {
            // TODO: 如果是虚拟模块怎么办呢？这里少逻辑，等写完数据库后完善
            parentVm.source = source;
            server.send('getVm', stringify(virtual_module));
            // 这里是强制更新，有问题
            viteServer.send(`${VmProfix}${parentVm.path}`);
            return;
        }
        const childWithoutExt = child.split('.')[0];
        const tag = childWithoutExt
            .split('-')
            .map((c) => c[0].toUpperCase() + c.slice(1))
            .join('');
        const { dir, name } = parse(id);

        const sonPath = join(
            replaceVmPrefix(dir),
            name,
            `${childWithoutExt}.vue`
        );
        const sonVm: Vm = createVm({
            path: sonPath,
            source: source,
            childComponent: new Map()
        });

        virtual_module.set(sonPath, sonVm);
        // 是否已经引入了这个子模块
        // const includedIndex = parentVm.childComponent?.findIndex(
        //     (item) => item.path === sonVm.path
        // );
        // 命名一致，得提示是否覆盖，如果覆盖，则继续，否则让用户修改
        parentVm.childComponent?.set(sonPath, sonVm);

        const s = new MagicString(parentVm.source);
        const ast = sfcParse(parentVm.source);
        const importStatement = `import ${tag} from '${VmProfix}${sonPath}'`;

        const {
            start: tStart,
            end: tEnd,
            indent: tIndent
        } = getAstPos(ast, pos, 'template');
        const { start: sStart, indent: sIndent } = getAstPos(
            ast,
            pos,
            'script'
        );

        if (prepend) {
            s.appendLeft(tStart, `<${tag}></${tag}>\n${' '.repeat(tIndent)}`);
        } else {
            s.appendLeft(tEnd, `\n${' '.repeat(tIndent)}<${tag}></${tag}>`);
        }
        s.appendLeft(sStart, `\n${importStatement}`);

        if (fileExist(parentVm.path)) {
            writeFileSync(parentVm.path, s.toString());
            parentVm.source = s.toString();
        } else if (virtual_module.has(parentVm.path)) {
            parentVm.source = s.toString();
            // 如果是虚拟文件的话，得监听虚拟file，才方便触发vue更新
            viteServer.send(`${VmProfix}${parentVm.path}`);
        } else {
            console.log('不存在啊');
        }
        server.send('getVm', stringify(virtual_module));
    });
};

function replaceVmPrefix(id: string) {
    return id.replace(VmProfix, '');
}

function fileExist(filepath: string) {
    try {
        statSync(filepath);
        return true;
    } catch (e) {
        return false;
    }
}
