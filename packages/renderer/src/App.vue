<template>
    <div class="app">
        <div class="left-content">
            <RouterMenu
                :matchPath="matchPath"
                @addRoute="addRoute"
                @jump="jump"
                :routerConf="routerConf"
            ></RouterMenu>
            <ComponentsView
                @onMove="comDragMove"
                @onUp="comDragUp"
                @onComponentHover="comHover"
                @onComponentLeave="comLeave"
                :activeComPath="hightlightComPath"
            ></ComponentsView>
            <CommonUtilsView
                @add="addUtil"
                @modify="modifyUtil"
            ></CommonUtilsView>
        </div>
        <div class="virtual-browser">
            <!-- 模拟地址栏 -->
            <div class="address-bar">
                {{ route.path }}
            </div>
            <router-view
                @click.right="addComponent"
                @mousemove="hightlightComponent"
                @mouseout="removeHightlight"
            ></router-view>
        </div>
        <div class="right-content">
            <InstanceState
                v-model:curComInstance.sync="curComInstance"
                :componentName="componentName"
                :instanceStates="instanceStates"
            ></InstanceState>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { getCurrentInstance, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { RouteRecordNormalized } from 'vue-router';
import {
    VmProfix,
    UtilProfix,
    GetCurComponent,
    GetCurUtil,
    UPDATECOMPONENT,
    UPDATEROUTER,
    FRESHCACHE,
    ADDCOMPONENTBYDRAG,
    UPDATECOMMONUTILS,
    TIPS,
    GETALLROUTER
} from '../../utils/const/';
import RouterMenu from './components/routerMenu/index.vue';
import ComponentsView from './components/componentsView/index.vue';
import CommonUtilsView from './components/commonUtilsView/index.vue';
import InstanceState, { stateType } from './components/instanceState/index.vue';
import {
    memoData,
    getComponentName,
    noop,
    getInstanceState as devtoolsGetInstanceState
} from '../utils/';

window.ipc.on(TIPS, (event, tips) => {
    ElMessage({
        message: tips,
        type: 'warning'
    });
});

const stateTypeindex = stateType.reduce(
    (res, item, index) => ({ ...res, [item]: index }),
    {}
);

// TODO:
// 已经添加进来的组件，搞成可拖拽的
// hover得加个定时器，不然没法看到又得组件的相关状态
// 当修改组件的时候，组件的相关状态得清除掉，或者想办法同步回file里？？？

// 在开发vcode过程中，重启main进程，没有杀掉fork的vite服务，导致一些问题
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

// 获取数据库存储的内容
window.ipc.send(GETALLROUTER);
window.ipc.on(GETALLROUTER, (event, data) => {
    for (const route of data) {
        router.addRoute(routerConf.value[0].name, {
            name: route.routeName,
            path: route.path,
            component: () =>
                import(/* @vite-ignore */ `${VmProfix}${route.component}`)
        });
        routerConf.value[0].children.push(route);
    }
});

const componentName = ref();
const instanceStates = ref([]);

let lastEl: Element;
function comDragMove(x, y, dragedComPath) {
    if (lastEl) {
        lastEl.classList.remove('prepend');
        lastEl.classList.remove('append');
    }
    let el = document.elementFromPoint(x, y);
    lastEl = el;

    if (!memoData.rootCom.contains(el)) {
        return;
    }
    const { el: parentEl, id } = getComponentInfo(el);
    if (id.replace(VmProfix, '') === dragedComPath) {
        return;
    }
    if (el === parentEl) {
        return;
    }
    const { bottom, height } = el.getBoundingClientRect();
    const midLine = (bottom - height / 2) >> 0;
    if (y > midLine) {
        el.classList.add('append');
    } else {
        el.classList.add('prepend');
    }
}
function comDragUp(x, y, dragedComPath) {
    if (lastEl) {
        lastEl.classList.remove('prepend');
        lastEl.classList.remove('append');
    }
    let el = document.elementFromPoint(x, y);

    if (!memoData.rootCom.contains(el)) {
        return;
    }
    const { id, el: parentEl } = getComponentInfo(el);
    if (id.replace(VmProfix, '') === dragedComPath) {
        return;
    }
    if (el === parentEl) {
        return;
    }
    const { bottom, height } = el.getBoundingClientRect();
    const midLine = bottom - height / 2;
    let pos;
    let prepend = false;
    if (y > midLine) {
        pos = getPosFromEl(el, parentEl, 'append');
    } else {
        prepend = true;
        pos = getPosFromEl(el, parentEl, 'prepend');
    }
    // 拖拽组件更新页面
    window.ipc.send(ADDCOMPONENTBYDRAG, {
        id,
        pos,
        prepend,
        child: dragedComPath
    });
}

let lastHightlightChildren: Element[] = [];
let lastComPath;
function comLeave() {
    for (const c of lastHightlightChildren) {
        c.classList.remove('hightlight');
    }
    lastHightlightChildren = [];
    lastComPath = '';
}
function comHover(comPath) {
    if (lastComPath === comPath) {
        return;
    }
    lastComPath = comPath;
    const children = memoData.rootCom?.children;
    type Children = typeof children;
    function dfs(children: Children) {
        if (!children) {
            return;
        }
        for (let i = 0, len = children.length; i < len; ++i) {
            const cur = children[i];
            if (cur.__vueParentComponent.type.__file === comPath) {
                lastHightlightChildren.push(cur);
                cur.classList.add('hightlight');
                continue;
            }
            dfs(cur.children);
        }
    }
    dfs(memoData.rootCom?.children);
}

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
                    const source = await getComSource('', false);
                    openEditor({
                        source,
                        isModifyRoute: true,
                        updateSelf: false,
                        parentRoutePath: path,
                        parentRouteName: router
                            .getRoutes()
                            .filter((route) => route.path === path)[0].name,
                        onConfirm: addRouteTopage
                    });
                }
            }
            // TODO: 删 改 + 整体数据库 数据库是否也要加一个版本控制？因为没有git了
            // 增加了props后hmr更新还是有问题
            // 对了，git咋集成呢。。 利用gitignore
            // 或者说git提交的是虚拟文件 + 产出的结果，而不是传统的那种文件内容了
            // 看来必须得是产出的结果，不然code review的时候不太好看啊
        ]
    });
}

async function addUtil() {
    openEditor({
        source: '',
        updateSelf: false,
        onConfirm({ info }) {
            const { child, source } = info;
            window.ipc.send(UPDATECOMMONUTILS, {
                id: child,
                source
            });
        }
    });
}

function modifyUtil(x, y, utilId) {
    app.$openContextmenu({
        x,
        y,
        menuItems: [
            {
                label: 'modify',
                async callback() {
                    const source = await getUtilSource(utilId);
                    openEditor({
                        id: utilId,
                        source,
                        updateSelf: true,
                        onConfirm({ info }) {
                            const { child, source } = info;
                            window.ipc.send(UPDATECOMMONUTILS, {
                                id: child,
                                source,
                                update: true
                            });
                        }
                    });
                }
            }
        ]
    });
}
const element = ref();

function addComponent($event) {
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
async function modify() {
    try {
        const selectEl = element.value;
        const { id } = getComponentInfo(selectEl);
        const source = await getComSource(id, true);
        if (source) {
            openEditor({ id, source, onConfirm: modifyComponent });
        } else {
            ElMessage({
                message: 'can not find component',
                type: 'warning'
            });
        }
    } catch (e) {
        console.log(e);
    }
}
async function append() {
    const selectEl = element.value;
    const { id, el: parentEl } = getComponentInfo(selectEl);
    const pos = getPosFromEl(selectEl, parentEl, 'append');
    const source = await getComSource(id, false);
    if (source) {
        openEditor({
            id,
            source,
            pos,
            updateSelf: false,
            onConfirm: modifyComponent
        });
    } else {
        ElMessage({
            message: 'can not find component',
            type: 'warning'
        });
    }
}
async function prepend() {
    const selectEl = element.value;
    const { id, el: parentEl } = getComponentInfo(selectEl);
    const pos = getPosFromEl(selectEl, parentEl, 'prepend');
    const source = await getComSource(id, false);
    if (source) {
        openEditor({
            id,
            source,
            pos,
            updateSelf: false,
            prepend: true,
            onConfirm: modifyComponent
        });
    } else {
        ElMessage({
            message: 'can not find component',
            type: 'warning'
        });
    }
}

function addRouteTopage({
    isModifyRoute,
    parentRoutePath,
    parentRouteName,
    info
}) {
    window.ipc.send(UPDATEROUTER, {
        ...info,
        isModifyRoute,
        parentRoutePath
    });
    const routePath = parentRoutePath + info.routePath;
    let vmBasePath = `${VmProfix}${PAGEPATH}${parentRoutePath}`;
    vmBasePath = vmBasePath.endsWith('/') ? vmBasePath : vmBasePath + '/';
    // 新增路由
    router.addRoute(parentRouteName, {
        name: info.routeName,
        path: routePath,
        component: () =>
            import(/* @vite-ignore */ `${vmBasePath}${info.child}.vue`)
    });
    const newRoute = router
        .getRoutes()
        .filter((route) => route.path === routePath)[0];
    if (!newRoute) {
        console.log('插入新路由失败，请重试');
    }
    const parentRoute = getParentRoute(routerConf.value, parentRoutePath);
    parentRoute.children.push(newRoute);
}

function modifyComponent({ id, pos, updateSelf, prepend, info }) {
    window.ipc.send(UPDATECOMPONENT, {
        ...info,
        id,
        pos,
        updateSelf,
        prepend
    });
}

function openEditor({
    id = '',
    source = '',
    pos = [],
    updateSelf = true,
    prepend = false,
    isModifyRoute = '',
    parentRoutePath = '',
    parentRouteName = '',
    onConfirm = noop
}) {
    const closeEditor = app.$openEditor({
        isModifyRoute,
        parentRoutePath,
        id: updateSelf ? id : '',
        sourceText: source,
        update(info) {
            onConfirm({
                id,
                pos,
                updateSelf,
                prepend,
                isModifyRoute,
                parentRoutePath,
                parentRouteName,
                info
            });
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

function getPosFromEl(curEl, parentEl, whichPend) {
    const pos: number[] = [];
    getPos(parentEl, curEl, pos, whichPend);
    return pos;
}

async function getComSource(id, updateSelf) {
    try {
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
            // TODO: GetCurComponent这个标志真的有必要吗？
            window.ipc.send(FRESHCACHE, {
                id: `${GetCurComponent}${id.replace(VmProfix, '')}`
            });
            const { default: code } = await import(
                /* @vite-ignore */ `${GetCurComponent}${id.replace(
                    VmProfix,
                    ''
                )}?t=${Date.now()}`
            );
            source = code;
        }
        return source;
    } catch (e) {
        console.log(e);
    }
}

async function getUtilSource(id) {
    try {
        // 工具方法，更新后，无法拉取最新的，被vite拦截返回缓存了...
        // 还是看veit 的 ensureEntryFromUrl 方法
        window.ipc.send(FRESHCACHE, {
            id: `${GetCurUtil}${id}`
        });
        return (
            await import(
                /* @vite-ignore */ `${GetCurUtil}${id}?t=${Date.now()}`
            )
        ).default;
    } catch (e) {
        console.log(e);
    }
}

const hightlightComPath = ref('');
function hightlightComponent($event) {
    const { el, id, instance } = getComponentInfo($event.target);
    getInstanceState(instance);
    hightlightComPath.value = id;
    componentName.value = getComponentName(id);
    !el.classList.contains('hightlight') && el.classList.add('hightlight');
}
function removeHightlight($event) {
    const { el } = getComponentInfo($event.target);
    hightlightComPath.value = '';
    el.classList.contains('hightlight') && el.classList.remove('hightlight');
}
const curComInstance = ref();
function getComponentInfo(el: Element) {
    let elWithVnode = el;
    while (!elWithVnode.__vueParentComponent) {
        elWithVnode = elWithVnode.parentElement;
    }
    return {
        el: elWithVnode.__vueParentComponent.vnode.el,
        id: elWithVnode.__vueParentComponent.type.__file,
        instance: elWithVnode.__vueParentComponent
    };
}

// 获取当前组件实例和组件的状态
function getInstanceState(instance) {
    const instanceState = devtoolsGetInstanceState(instance);
    const _instanceStates = stateType.map(() => []);
    instanceState.forEach((item) =>
        _instanceStates[stateTypeindex[item.type]].push(item)
    );
    instanceStates.value = _instanceStates;
    curComInstance.value = instance;
}

function getPos(parent, child, pos, whichPend) {
    let n = 0;
    let children;
    if (child.parentElement === parent) {
        children = parent.children;
    } else {
        children = child.parentElement.children;
    }

    // TODO: 得优化逻辑。。还有component.ips.ts那个文件里
    for (let i = 0, len = children.length; i < len; ++i) {
        const curNode = children[i];
        const curDirective = curNode.dataset && curNode.dataset.vcodeDirective;

        let type, start, end;
        if (curDirective) {
            [type, start, end] = curDirective.split('-');
            n = end;
        }

        if (curNode === child) {
            if (type) {
                // 如果当前是有被mark
                if (whichPend === 'append') {
                    pos.unshift(end);
                } else {
                    pos.unshift(start);
                }
            } else {
                // 没有被mark
                pos.unshift(n);
            }
            break;
        }
        if (type) {
            n = end;
        }
        ++n;
    }

    if (child.parentElement === parent) {
        return pos;
    } else {
        return getPos(parent, child.parentElement, pos, whichPend);
    }
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
.append {
    box-shadow: 0 2px 0 0 #76b088;
    outline: ;
}
.prepend {
    box-shadow: 0 -2px 0 0 #76b088;
}
</style>
<style lang="less" scoped>
.app {
    height: 100%;
    display: flex;
}
// TODO: less 如何添加统一的样式，还有不同的风格或者暗黑模式
.virtual-browser {
    width: calc(100vw - 360px);
    display: flex;
    flex-direction: column;
    overflow: auto;
}
.left-content,
.right-content {
    width: 180px;
}
.left-content {
    display: flex;
    flex-direction: column;
    // justify-content: space-between;
    box-shadow: #000000 -6px 0 6px -6px inset;
}
.right-content {
    height: 100%;
    overflow: auto;
    box-shadow: #000000 6px 0 6px -6px inset;
    box-sizing: border-box;
    padding: 0 10px;
    background-color: #0c1015;
}
.btn-wrap {
    display: flex;
    justify-content: space-around;
}
</style>
