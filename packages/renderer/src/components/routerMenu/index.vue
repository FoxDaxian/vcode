<template>
    <div class="router-menu-box">
        <!-- <ElMenu :default-active="index" active-text-color="#000"> -->
        <Menu
            :matchPath="matchPath"
            @jump="jump"
            @addRoute="addRoute"
            parentRoute="/"
            :routerConf="routerConf"
        ></Menu>
        <!-- </ElMenu> -->
    </div>
</template>

<script lang="ts">
export default {
    name: 'router-menu'
};
</script>

<script lang="ts" setup>
import Menu from './menu.vue';
import type { RouteRecord } from 'vue-router';
import { ElMenu } from 'element-plus';
const props = defineProps<{
    routerConf: RouteRecord[];
    matchPath: RouteRecord[];
}>();
const emit = defineEmits(['addRoute', 'jump']);

function addRoute($event, info) {
    emit('addRoute', $event, info);
}
function jump(path) {
    emit('jump', path);
}
</script>

<style lang="less" scoped>
.router-menu-box {
    padding: 10px 10px 0 5px;
}
</style>
