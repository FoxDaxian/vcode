import type {
    BaseElementNode,
    TemplateChildNode,
    RootNode
} from '@vue/compiler-core';

export default (ast: RootNode, pos: number[], type: string) => {
    // 比如template或者script，必须得有，如果没有的话，默认补全下即可
    const templateAst = ast.children.filter(
        (c) => (c as BaseElementNode).tag === type
    )[0];

    const template: TemplateChildNode | undefined = templateAst
        ? (templateAst as BaseElementNode).children[0]
        : undefined;

    if (!template) {
        throw new Error('template或script两种类型必须有内容，否则无法插入内容');
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
