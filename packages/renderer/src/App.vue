<template>
    <div class="app">
        <div class="left-content">
            <RouterMenu
                :matchPath="matchPath"
                @addRoute="addRoute"
                @jump="jump"
                :routerConf="routerConf"
            ></RouterMenu>
        </div>
        <div class="virtual-browser">
            <!-- 模拟地址栏 -->
            <div class="address-bar">
                {{ route.path }}
            </div>
            <router-view
                @click.right="showDialog"
                @mousemove="addHightlight"
                @mouseout="removeHightlight"
            ></router-view>
        </div>
        <div class="right-content">我是右侧</div>
    </div>
</template>

<script lang="ts" setup>
import { ElDialog, ElButton } from 'element-plus';
import { getCurrentInstance, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { RouteRecordRaw, RouteRecordNormalized } from 'vue-router';
import {
    VmProfix,
    GetCurComponent,
    UpdateComponent,
    UpdateRouter
} from '../../utils/const/index';
import RouterMenu from './components/routerMenu/index.vue';

// TODO:
// 如何定义路由呢？
// 某个地方显示所有的页面，选中一个页面后，显示页面内所有的组件
// jsx支持
// 编辑器样式 智能提示
// debuger
// 公共组件提取 拖拽式开发 拖拽式生态

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
const router = useRouter();
const route = useRoute();

const matchPath = computed(() => {
    return route.matched.map((_) => _.path);
});

// 从数据库初始化，然后就在这里一直更新，某个时机同步到数据库即可
// 路由对应获取组件部分可能有问题
const routerConf = ref<RouteRecordNormalized[]>(initRoutes());

function jump(path) {
    console.log(path, '===');
    router.push({ path });
}
async function addRoute($event, info) {
    // 这个右键目录，组件部分也得用的样子
    app.$openContextmenu({
        x: $event.clientX,
        y: $event.clientY,
        menuItems: [
            {
                label: 'insert route',
                async callback() {
                    const { path } = info;
                    const source = await getSource('', false);
                    openEditor({
                        source,
                        insertOrNew: 'insert',
                        updateSelf: false,
                        parentRoutePath: path,
                        parentRouteName: router
                            .getRoutes()
                            .filter((route) => route.path === path)[0].name
                    });
                }
            },
            // TODO: 删 改 + 整体数据库 数据库是否也要加一个版本控制？因为没有git了
            // 对了，git咋集成呢。。
            // 或者说git提交的是虚拟文件 + 产出的结果，而不是传统的那种文件内容了
            // 看来必须得是产出的结果，不然code review的时候不太好看啊
            {
                label: 'delete route',
                async callback() {
                    const { path } = info;
                    const source = await getSource('', false);
                    openEditor({
                        source,
                        insertOrNew: 'delete',
                        updateSelf: false,
                        parentRoutePath: path,
                        parentRouteName: router
                            .getRoutes()
                            .filter((route) => route.path === path)[0].name
                    });
                }
            }
        ]
    });
}
const dialogShow = ref(false);
const element = ref();

function showDialog($event) {
    const { el: parentEl } = getComponentInfo($event.target);
    const showInsert = $event.target !== parentEl;
    element.value = $event.target;
    const modifyMenu = {
        label: 'modify',
        callback() {
            modify();
        }
    };
    const appendMenu = {
        label: 'append',
        async callback() {
            append();
        }
    };
    const prependMenu = {
        label: 'prepend',
        async callback() {
            prepend();
        }
    };
    const menuItems = [modifyMenu];
    if (showInsert) {
        menuItems.push(appendMenu, prependMenu);
    }

    app.$openContextmenu({
        x: $event.clientX,
        y: $event.clientY,
        menuItems
    });
}
function toggleDialog() {
    dialogShow.value = !dialogShow.value;
}
async function modify() {
    const selectEl = element.value;
    const { id } = getComponentInfo(selectEl);
    const source = await getSource(id, true);
    openEditor({ id, source });
    toggleDialog();
}
async function append() {
    const selectEl = element.value;
    const { id, el: parentEl } = getComponentInfo(selectEl);
    const pos = getPosFromEl(selectEl, parentEl);
    const source = await getSource(id, false);
    openEditor({ id, source, pos, updateSelf: false });
    toggleDialog();
}
async function prepend() {
    const selectEl = element.value;
    const { id, el: parentEl } = getComponentInfo(selectEl);
    const pos = getPosFromEl(selectEl, parentEl);
    const source = await getSource(id, false);
    openEditor({ id, source, pos, updateSelf: false, prepend: true });
    toggleDialog();
}

function openEditor({
    id = '',
    source = '',
    pos = [],
    updateSelf = true,
    prepend = false,
    insertOrNew = '',
    parentRoutePath = '',
    parentRouteName = ''
}) {
    const closeEditor = app.$openEditor({
        insertOrNew,
        parentRoutePath,
        id: updateSelf ? id : '',
        sourceText: source,
        update(info) {
            // 新增路由还有有问题，新增路由怎么新增平级的呢？需要这个功能么？

            // 新增路由
            if (insertOrNew) {
                window.ipc.send(UpdateRouter, {
                    ...info,
                    insertOrNew,
                    parentRoutePath
                });
                const routePath = parentRoutePath + info.routePath;
                let vmBasePath = `${VmProfix}${PAGEPATH}${parentRoutePath}`;
                vmBasePath = vmBasePath.endsWith('/')
                    ? vmBasePath
                    : vmBasePath + '/';
                router.addRoute(parentRouteName, {
                    name: info.routeName,
                    path: routePath,
                    component: () =>
                        import(
                            /* @vite-ignore */ `${vmBasePath}${info.child}.vue`
                        )
                });
                const newRoute = router
                    .getRoutes()
                    .filter((route) => route.path === routePath)[0];
                if (!newRoute) {
                    console.log('插入新路由失败，请重试');
                }
                const parentRoute = getParentRoute(
                    routerConf.value,
                    parentRoutePath
                );
                parentRoute.children.push(newRoute);
            } else {
                window.ipc.send(UpdateComponent, {
                    ...info,
                    id,
                    pos,
                    updateSelf,
                    prepend,
                    insertOrNew,
                    parentRoutePath
                });
            }
            closeEditor();
        },
        cancel() {
            closeEditor();
        }
    });
}
function getParentRoute(routers, targetPath) {
    for (const route of routers) {
        if (route.path === targetPath) {
            return route;
        }
        if (route.children) {
            const res = getParentRoute(route.children, targetPath);
            if (res) {
                return res;
            }
        }
    }
    return false;
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
function getMenuIndex(route: RouteRecordRaw) {
    let count = 1;
    while (route.children && route.children.length) {
        const child = route.children[0];
        count++;
        route = child;
    }
    return new Array(count).fill('0').join('-');
}

function initRoutes() {
    const routes = router.getRoutes();
    const children = new Set();
    for (const route of routes) {
        if (route.children && route.children.length > 0) {
            getChildren(route.children);
        }
    }

    function getChildren(routes) {
        for (const route of routes) {
            children.add(route.path);
            if (route.children && route.children.length > 0) {
                getChildren(route.children);
            }
        }
    }
    return routes.filter((route) => !children.has(route.path));
}
</script>

<style>
.hightlight {
    background-color: rgba(0, 0, 0, 0.1);
}
</style>
<style lang="less" scoped>
.app {
    height: 100%;
    display: flex;
}
.virtual-browser {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow: auto;
}
.left-content,
.right-content {
    width: 180px;
}
.left-content {
    box-shadow: #000000 -6px 0 6px -6px inset;
}
.right-content {
    box-shadow: #000000 6px 0 6px -6px inset;
}
.btn-wrap {
    display: flex;
    justify-content: space-around;
}
</style>
