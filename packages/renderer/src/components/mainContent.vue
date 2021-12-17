<template>
    <div class="main-content" ref="contentRef">
        <div class="left-content">我是左侧</div>
        <PageContent
            @mousedown="showDialog"
            @mousemove="addHightlight"
            @mouseout="removeHightlight"
        ></PageContent>
        <div class="right-content">我是右侧</div>
        <ElDialog
            v-model="dialogShow"
            :show-close="false"
            title="modify what you want"
        >
            <div class="btn-wrap">
                <el-button type="primary" @click="modify" size="mini" round
                    >modify</el-button
                >
                <el-button
                    v-if="showInsert"
                    type="primary"
                    @click="append"
                    size="mini"
                    round
                    >append</el-button
                >
                <el-button
                    v-if="showInsert"
                    type="primary"
                    @click="prepend"
                    size="mini"
                    round
                    >prepend</el-button
                >
            </div>
        </ElDialog>
    </div>
</template>

<script lang="ts" setup>
import { ElDialog, ElButton } from 'element-plus';
import { getCurrentInstance, ref } from 'vue';
import PageContent from './interactionComponent/pageContent.vue';
import { VmProfix, GetCurComponent } from '../../../utils/const/index';
// 思路一：再启动一个vite或者react等，然后操作的部分是src 但是，你要怎么操作呢？
// 嵌入一些生成内容的script？
// 在主render加一层遮罩？那滚动条怎么处理

// 需要嵌入一个收集器!!  TODO!!!
// 在guest page收集信息，然后再吐给embedded page
// guest page 放结果，一点点输入进去
// 嵌入的两种方案：
// 1、 嵌入vite插件，进而插入script
// 2、 代理成同源

// 目前思路一遇到了一些问题有些卡住了，目前再考虑思路三

// 思路二：操作ast，但是这个ast是文件层面的ast，而不仅仅是代码层面的

// 思路三：直接在当前窗口下渲染，然后收集信息，放到产出里，设计到ast互转？

// 思路四：把vue直接放过去，或者把vue、react等编译后的产出放进去，或者把非vue的template转成vue的放进去

// 也得支持组件拖拽之类的，或者搜索后直接放那也行

// 按照正常的思考来，怎么初始化一个vue或者react项目？先简单些来，先弄vue的，需要做的通用些，方便之后的扩展
// 换句话来说，就是产出什么样的代码或直接dist产物？然后 怎么 产出？
// 我想改用户在页面上直接编写组件（这个组件其实只是一个内容，可以转成组件也可以保持不动），那是不是同样需要css scope?
// 解析模板的时候不一定动态，也可以根据不同模板使用不同方式，也就是搞映射map
// 接口怎么搞？公共配置怎么搞？类型之类的怎么搞？
// 还得找一个支持ts、esling这类的编辑器嵌入进来
// 不同文件要展示不同内容？比如.vue、.jsx或.html展示页面，ts、js这类展示代码？
// 还需要全局数据进行通信？

const app = getCurrentInstance().appContext.config.globalProperties;
const dialogShow = ref(false);
const showInsert = ref(false);
const element = ref();

function showDialog($event) {
    if ($event.which !== 3) {
        return;
    }
    const { el: parentEl } = getComponentInfo($event.target);
    showInsert.value = $event.target !== parentEl;
    element.value = $event.target;
    toggleDialog();
}
function toggleDialog() {
    dialogShow.value = !dialogShow.value;
}
async function modify() {
    const selectEl = element.value;
    const { id } = getComponentInfo(selectEl);
    const source = await getSource(id, true);
    openEditor(id, source, [], true);
}
async function append() {
    const selectEl = element.value;
    const { id, el: parentEl } = getComponentInfo(selectEl);
    const pos = getPosFromEl(selectEl, parentEl);
    const source = await getSource(id, false);
    openEditor(id, source, pos, false);
}
async function prepend() {
    const selectEl = element.value;
    const { id, el: parentEl } = getComponentInfo(selectEl);
    const pos = getPosFromEl(selectEl, parentEl);
    const source = await getSource(id, false);
    openEditor(id, source, pos, false, true);
}

function openEditor(id, source, pos, updateSelf, prepend = false) {
    const closeEditor = app.$openEditor({
        id: updateSelf ? id : '',
        sourceText: source,
        update(info) {
            window.ipc.send('add-component', { ...info, id, pos, updateSelf, prepend });
            closeEditor();
        },
        cancel() {
            closeEditor();
        }
    });
    toggleDialog();
}
function getPosFromEl(curEl, parentEl) {
    const pos: number[] = [];
    getPos(parentEl, curEl, pos);
    return pos;
}

async function getSource(id, updateSelf) {
    let source = [
        '<template>',
        '    <div class="ttt">',
        '        <h1>占位用的</h1>',
        '    </div>',
        '</template>',
        '<script lang="ts" setup>',
        '<' + '/script>',
        '<style lang="less" scoped>',
        '</style>'
    ].join('\n');
    if (updateSelf) {
        const { default: code } = await import(
            /* @vite-ignore */ `${GetCurComponent}${id.replace(VmProfix, '')}`
        );
        source = code;
    }
    return source;
}

function addHightlight($event) {
    const { el } = getComponentInfo($event.target);
    !el.classList.contains('hightlight') && el.classList.add('hightlight');
}
function removeHightlight($event) {
    const { el } = getComponentInfo($event.target);
    el.classList.contains('hightlight') && el.classList.remove('hightlight');
}
function getComponentInfo(el: Element) {
    let elWithVnode = el;
    while (!elWithVnode.__vueParentComponent) {
        elWithVnode = elWithVnode.parentElement;
    }
    const parentEl = elWithVnode.__vueParentComponent.vnode.el;
    const id = elWithVnode.__vueParentComponent.type.__file;
    return { el: parentEl, id };
}

function getPos(parent, child, pos) {
    if (child.parentElement === parent) {
        pos.unshift(Array.prototype.indexOf.call(parent.childNodes, child));
        return pos;
    } else {
        pos.unshift(
            Array.prototype.indexOf.call(child.parentElement.childNodes, child)
        );
        return getPos(parent, child.parentElement, pos);
    }
}
</script>

<style>
.hightlight {
    background-color: rgba(0, 0, 0, 0.1);
}
</style>
<style lang="less" scoped>
.main-content {
    height: 100%;
    display: flex;
}
.page-content {
    border: 1px solid #000;
    flex-grow: 1;
    overflow: auto;
}
.left-content,
.right-content {
    width: 20%;
}
.btn-wrap {
    display: flex;
    justify-content: space-around;
}
</style>
