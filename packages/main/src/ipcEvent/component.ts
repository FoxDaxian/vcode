import { ipcMain } from 'electron';
import createVm from '../utils/createVm';
import MagicString from 'magic-string';
import { join, parse } from 'path';
import stringify from '../utils/stringify';
import { parse as sfcParse } from '@vue/compiler-dom';
import { VmProfix, UpdateComponent } from '../../../utils/const/index';
import getAstPos from '../utils/getAstPos';
import type SocketBase from '../../../utils/socket/SockeBase';
import type { ChildProcess } from 'child_process';
import type {
    BaseElementNode,
    TemplateChildNode,
    RootNode
} from '@vue/compiler-core';

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
            const s = new MagicString(source);
            const ast = sfcParse(source);
            markDirective(ast, s);
            parentVm.source = s.toString();
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
        if (!parentVm.source.includes(importStatement)) {
            s.appendLeft(sStart, `\n${importStatement}`);
        }

        if (virtual_module.has(parentVm.path)) {
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

function markDirective(ast: RootNode, s: MagicString) {
    // 标记所有的v-for标签
    const children = ast.children.filter(
        (c) => (c as BaseElementNode).tag === 'template'
    );
    const vIf = ['if', 'else-if', 'else'];
    dfs(children);
    function dfs(nodes: TemplateChildNode[]) {
        // 收集v-if v-else-if v-else
        const vIfNodes = new Map<number, BaseElementNode>();
        let hasVIf = false;
        for (const node of nodes) {
            let hasVIfProp = false;
            if ((node as BaseElementNode).props) {
                let dataSetStart = -1;
                let dataSetEnd = -1;
                for (const prop of (node as BaseElementNode).props) {
                    const { type, name, loc } = prop;
                    // for v-if
                    if (type === 7 && vIf.includes(name)) {
                        vIfNodes.set(loc.start.offset, node as BaseElementNode);
                        hasVIfProp = true;
                        continue;
                    }
                    // for v-for
                    if (type === 7 && name === 'for') {
                        const propStart = loc.start.offset;
                        const start = node.loc.start.offset;
                        const end = node.loc.end.offset;

                        if (dataSetStart === -1) {
                            s.appendLeft(
                                propStart,
                                genDataset('for', start, end)
                            );
                        } else {
                            s.overwrite(
                                dataSetStart,
                                dataSetEnd,
                                genDataset('for', start, end)
                            );
                            dataSetStart = dataSetEnd = -1;
                        }
                    }
                    if (type === 6 && name === 'data-vcode-directive') {
                        // for overwrite prev dateSet
                        dataSetStart = loc.start.offset;
                        dataSetEnd = loc.end.offset + 1;
                    }
                }
            }
            // 标记当前node的props中是否有v-if
            hasVIf = hasVIfProp;
            // 如果从true变成false了，且vIfNodes有记录，那么进行更新，包括覆盖旧的attribute
            if (!hasVIf && vIfNodes.size) {
                let start = -1;
                let end = 0;
                vIfNodes.forEach((node) => {
                    if (start === -1) {
                        start = node.loc.start.offset;
                    }
                    end = node.loc.end.offset;
                });
                vIfNodes.forEach((node, propStart) => {
                    // 看看有没有data-set，有的话得获取位置，然后覆盖掉
                    const existProp = node.props.find(
                        (p) => p.type === 6 && p.name === 'data-vcode-directive'
                    );
                    if (existProp) {
                        const existStart = existProp.loc.start.offset;
                        const existEnd = existProp.loc.end.offset + 1;

                        s.overwrite(
                            existStart,
                            existEnd,
                            genDataset('if', start, end)
                        );
                    } else {
                        s.appendLeft(propStart, genDataset('if', start, end));
                    }
                });
                vIfNodes.clear();
            }
            if ((node as BaseElementNode).children) {
                dfs((node as BaseElementNode).children);
            }
        }
        // 如果v-if是最后的元素，那么需要循环后走这个逻辑
        if (vIfNodes.size) {
            let start = -1;
            let end = 0;
            vIfNodes.forEach((node) => {
                if (start === -1) {
                    start = node.loc.start.offset;
                }
                end = node.loc.end.offset;
            });
            vIfNodes.forEach((node, propStart) => {
                // 看看有没有data-set，有的话得获取位置，然后覆盖掉
                const existProp = node.props.find(
                    (p) => p.type === 6 && p.name === 'data-vcode-directive'
                );
                if (existProp) {
                    const existStart = existProp.loc.start.offset;
                    const existEnd = existProp.loc.end.offset + 1;

                    s.overwrite(
                        existStart,
                        existEnd,
                        genDataset('if', start, end)
                    );
                } else {
                    s.appendLeft(propStart, genDataset('if', start, end));
                }
            });
            vIfNodes.clear();
        }
    }
}

function genDataset(type: string, start: number, end: number) {
    return `data-vcode-directive="${type}-${start}-${end}" `;
}
