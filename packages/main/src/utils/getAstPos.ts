import {
    BaseElementNode,
    TemplateChildNode,
    RootNode
} from '@vue/compiler-core';

export default (ast: RootNode, pos: number[], type: string) => {
    const templateAst = ast.children.filter(
        (c) => (c as BaseElementNode).tag === type
    )[0];

    const template: TemplateChildNode | undefined = templateAst
        ? (templateAst as BaseElementNode).children[0]
        : undefined;

    if (!template) {
        throw new Error('不能为空');
    }
    let t = template;
    if (type === 'template') {
        for (const p of pos) {
            t = (t as BaseElementNode).children[p];
        }
    }

    const indent = t.loc.start.column - 1;
    const start = t.loc.start.offset;
    const end = t.loc.end.offset;
    return { indent, start, end };
};
