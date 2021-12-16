<template>
    <div class="page-content" @click="openEditor">
        <span>123</span>
        <div class="n1">
            <div class="n2">
                <div class="n3">n31</div>
                <div class="n3">n32</div>
                <div class="n3">n33</div>
            </div>
            <div class="n21">
                <div class="n3">n231</div>
                <div class="n3">n232</div>
                <div class="n3">n233</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { getCurrentInstance } from 'vue';

const app = getCurrentInstance().appContext.config.globalProperties;


function openEditor($event) {
    const curEl = $event.target;
    let elWithVnode = $event.target;
    while (!elWithVnode.__vueParentComponent) {
        elWithVnode = elWithVnode.parentElement;
    }
    // 1、这样只支持有root节点包裹的，估计得看看vue是怎么实 无需 root 的方式了
    // 2、手写的组件可以，但是导入的组件要怎么获取索引呢？获取后要怎么插入内容呢？同用户手写的组件吗?
    // 不过最终还是没弄明白__vnode和__vueParentComponent的关系，还是没有找到对应的流程，目前的猜测是更新了subtree，没有更新__vnode
    // 这样是可行的，需要把中心部分改为组件，然后递归查找

    // 插入后，再插入，就有问题了，为啥？尽量需要用逻辑去想，而不是console调试
    // 数据库存储已经写好的内容

    const id = elWithVnode.__vueParentComponent.type.__file;
    const parentVnode = elWithVnode.__vueParentComponent.vnode;
    const parentEl = parentVnode.el;
    const pos: number[] = [];
    if (curEl !== parentEl) {
        getPos(parentEl, curEl, pos);
    } else {
        console.log('点击的是组件本身');
        return;
    }

    const closeEditor = app.$openEditor({
        pos,
        id,
        update(info: Info) {
            window.ipc.send('add-component', info);
            closeEditor();
        },
        cancel() {
            closeEditor();
        }
    });
}

function getPos(parent, child, pos) {
    if (child.parentElement === parent) {
        pos.unshift(Array.prototype.indexOf.call(parent.childNodes, child));
        return pos;
    } else {
        pos.unshift(Array.prototype.indexOf.call(child.parentElement.childNodes, child));
        return getPos(parent, child.parentElement, pos);
    }
}
</script>

<style lang="less" scoped>
.page-content {
    border: 1px solid red;
}
</style>
