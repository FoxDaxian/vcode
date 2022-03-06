import { ipcMain } from 'electron';
import createVm from '../utils/createVm';
import MagicString from 'magic-string';
import { join, parse } from 'path';
import stringify from '../utils/stringify';
import { parse as sfcParse } from '@vue/compiler-dom';
import {
    VmProfix,
    UPDATECOMPONENT,
    MARKFOROP,
    GETALLCOM
} from '../../../utils/const/index';
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
    rootModulePath,
    server,
    viteServer
}: {
    virtual_module: Map<string, Vm>;
    rootModulePath: string;
    server: SocketBase;
    viteServer: ChildProcess;
}) => {
    ipcMain.on(UPDATECOMPONENT, (event, info: Info) => {
        const { id, child, source, pos, updateSelf, prepend } = info;
        const parentVm: Vm = virtual_module.get(replaceVmPrefix(id))!;
        // 支持修改本身组件名
        if (updateSelf) {
            const s = new MagicString(source);
            const ast = sfcParse(source);
            markDirectiveViaAst(ast, s);
            parentVm.source = s.toString();
            server.send('getVm', stringify(virtual_module));
            // TODO: 这里是强制更新app，但是更新的是全部，好像没有定点更新
            // 新增props的时候，需要刷新下，不然挂载不上去，vite的问题
            viteServer.send(`${VmProfix}${parentVm.path}`);
            return;
        }
        const s = new MagicString(parentVm.source);
        const ast = sfcParse(parentVm.source);

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

        // 命名一致，得提示是否覆盖，如果覆盖，则继续，否则让用户修改
        parentVm?.childComponent?.set && parentVm?.childComponent?.set(sonPath, sonVm);

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
            const s2 = new MagicString(parentVm.source);
            const ast = sfcParse(parentVm.source);
            markDirectiveViaAst(ast, s2);
            parentVm.source = s2.toString();
            // 通知变动的组件
            event.reply(
                GETALLCOM,
                [...virtual_module.values()]
                    .map((vm) => vm.path)
                    .filter((p) => p !== rootModulePath)
            );
            // 这里可以加入组件内容，然后吐给app.vue，让他显示并且提供拖拽
            server.send('getVm', stringify(virtual_module));
            viteServer.send(`${VmProfix}${parentVm.path}`);
        } else {
            console.log('不存在啊');
        }
    });
};

function replaceVmPrefix(id: string) {
    return id.replace(VmProfix, '');
}

interface PropInfo {
    startOffset: number;
    indexOfParent: number;
}
type PropNodes = Map<PropInfo, BaseElementNode>;

function markDirectiveViaAst(ast: RootNode, s: MagicString) {
    // 标记所有的v-for标签
    const children = ast.children.filter(
        (c) => (c as BaseElementNode).tag === 'template'
    );
    const vIf = ['if', 'else-if', 'else'];
    dfs(children);
    function dfs(nodes: TemplateChildNode[]) {
        // 收集v-if v-else-if v-else
        const vIfNodes: PropNodes = new Map();
        const vForNodes: PropNodes = new Map();
        for (let i = 0, len = nodes.length; i < len; ++i) {
            const node = nodes[i];
            if ((node as BaseElementNode).props) {
                let hasIfProp = false;
                // 看看有没有v-if和v-for
                for (const prop of (node as BaseElementNode).props) {
                    const { type, name, loc } = prop;
                    // for v-if
                    if (type === 7 && vIf.includes(name)) {
                        hasIfProp = true;
                        vIfNodes.set(
                            { startOffset: loc.start.offset, indexOfParent: i },
                            node as BaseElementNode
                        );
                    }
                    // for v-for
                    if (type === 7 && name === 'for') {
                        vForNodes.set(
                            { startOffset: loc.start.offset, indexOfParent: i },
                            node as BaseElementNode
                        );
                    }
                }
                if (!hasIfProp) {
                    addIfAttr(vIfNodes, s, 'if');
                }
                addIfAttr(vForNodes, s, 'for');
            }
            if ((node as BaseElementNode).children) {
                dfs((node as BaseElementNode).children);
            }
        }
    }
}

function addIfAttr(pNodes: PropNodes, s: MagicString, prefix: string) {
    const end = pNodes.size;
    if (end) {
        const start = +[...pNodes.keys()][0].indexOfParent;
        pNodes.forEach((node, info) => {
            // 看看有没有data-set，有的话得获取位置，然后覆盖掉
            const existProp = node.props.find(
                (p) => p.type === 6 && p.name === MARKFOROP
            );
            if (existProp) {
                const existStart = existProp.loc.start.offset;
                const existEnd = existProp.loc.end.offset + 1;
                s.overwrite(
                    existStart,
                    existEnd,
                    genDataset(prefix, start, end + start - 1)
                );
            } else {
                s.appendLeft(
                    info.startOffset,
                    genDataset(prefix, start, end + start - 1)
                );
            }
        });
        pNodes.clear();
    }
}

function genDataset(type: string, start: number, end: number) {
    return `${MARKFOROP}="${type}-${start}-${end}" `;
}
