<template>
    <div class="menu-box" :style="{ paddingLeft: `${padding}px` }">
        <template v-for="(route, index) in routerConf" :key="route.path">
            <!-- parent -->
            <div v-if="route.children && route.children.length">
                <div class="route-box">
                    <div
                        :class="{
                            'jump-btn': true,
                            active: matchPath.includes(route.path)
                        }"
                        @click.stop="jump(route.path)"
                        @click.right="
                            addRoute($event, {
                                path: route.path,
                                parent: parentRoute
                            })
                        "
                    >
                        {{ route.name }}
                    </div>
                    <div class="line"></div>
                    <div class="toggle-btn" @click="toggleMenu(index)">
                        <ArrowUp
                            v-if="activeMenus[index]"
                            style="width: 15px; height: 15px"
                        />
                        <ArrowDown v-else style="width: 15px; height: 15px" />
                    </div>
                </div>
                <router-menu
                    v-if="activeMenus[index]"
                    :matchPath="matchPath"
                    @jump="jump"
                    @addRoute="addRoute"
                    :parentRoute="route.path"
                    :routerConf="route.children"
                ></router-menu>
            </div>
            <!-- son -->
            <div
                class="route-box"
                @click.right="
                    addRoute($event, {
                        path: route.path,
                        parent: parentRoute
                    })
                "
                v-else
            >
                <div
                    :class="{
                        'jump-btn': true,
                        active: matchPath.includes(route.path)
                    }"
                    @click.stop="jump(route.path)"
                >
                    {{ route.name }}
                </div>
            </div>
        </template>
    </div>
</template>

<script lang="ts">
export default {
    name: 'router-menu'
};
</script>

<script lang="ts" setup>
import { ref } from 'vue';
import type { RouteRecord } from 'vue-router';
const props = defineProps<{
    routerConf: RouteRecord[];
    parentRoute: string;
    matchPath: RouteRecord[];
}>();
const emit = defineEmits(['addRoute', 'jump']);
const activeMenus = ref(new Array(props.routerConf.length).fill(0));
const padding = (props.parentRoute.split('/').length - 1) * 5;

function toggleMenu(index) {
    activeMenus.value[index] = !activeMenus.value[index];
}

function addRoute($event, info) {
    emit('addRoute', $event, info);
}
function jump(path) {
    emit('jump', path);
}
</script>

<style lang="less" scoped>
.new-page {
    margin: 0 20px;
}
.menu-box {
    font-size: 15px;
    position: relative;
}
.menu-box::after {
    position: absolute;
    content: '';
    height: 100%;
    width: 0;
    border-left: 1px dashed #000;
    left: 0;
    top: 0;
}
.route-box {
    box-sizing: border-box;
    padding: 10px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.line {
    height: 1px;
    border-top: 1px dashed #cfd0d3;
    flex: 1;
    margin: 4px 20px 0;
}
.toggle-btn {
    cursor: pointer;
    display: flex;
    align-items: center;
}
.jump-btn {
    cursor: pointer;
    display: flex;
    align-items: center;
}
.jump-btn:hover {
    color: #409eff;
}
.active {
    color: #409eff;
}
</style>
