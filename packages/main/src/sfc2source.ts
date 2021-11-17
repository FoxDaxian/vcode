import { SFCDescriptor, SFCBlock } from '@vue/compiler-sfc';
// type: string;
// content: string;
// attrs: Record<string, string | true>;
// loc: SourceLocation;
// map?: RawSourceMap;
// lang?: string;
// src?: string;

export default (sfc: SFCDescriptor, injectSfc?: SFCDescriptor) => {
    // 缓存新增组件，模板中增加插入的名称，需要支持组件tree shaking
    // main 进程 与vite 进程通信
    const { template, scriptSetup, script, styles, customBlocks } = sfc;
    const blocks = [template, scriptSetup, script, ...styles, ...customBlocks];
    return (blocks.filter((_) => _ !== null) as SFCBlock[])
        .sort((a, b) => a.loc.start.offset - b.loc.start.offset)
        .reduce((code, b, i) => {
            const o = createOpenTag(b);
            const e = createEndTag(b);
            let content = ''; // injected import ot tag
            if (b.type === 'template') {
                content = '\n<Test></Test>';
            }
            if (b.type === 'script' && b.attrs['setup']) {
                content = '\nimport Test from \'@vcode_virtual_module/test.vue\';';
            }
            return (code += '\n'.repeat((i / i) * 2) + o + content + b.content + e);
        }, '');
};

function createOpenTag(block: SFCBlock) {
    return `<${block.type}${getAttrs(block.attrs)}>`;
}
function createEndTag(block: SFCBlock) {
    return `</${block.type}>`;
}
function getAttrs(attrs: SFCBlock['attrs']) {
    const res = Object.entries(attrs).map(([k, v]) =>
        typeof v === 'boolean' ? (v ? `${k}` : `${k}=${v}`) : `${k}=${v}`
    );
    return res.length ? ' ' + res.join(' ') : '';
}
