<template>
    <div class="utils-wrap">
        <div class="title">
            <div class="text">utils</div>
            <div class="add" @click="add">+</div>
        </div>
        <div
            class="util"
            v-for="util in utils"
            :key="util"
            @click.right="modify($event, util)"
        >
            {{ util }}
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { GETALLUTIL } from '../../../../utils/const/index';
const emit = defineEmits(['modify', 'add']);
// 获取所有的组件
const utils = ref<string[]>([]);
window.ipc.on(GETALLUTIL, (event, data) => {
    utils.value = data;
});
function modify($event, path: string) {
    emit('modify', $event.clientX, $event.clientY, path);
}
function add() {
    emit('add');
}
</script>

<style lang="less" scoped>
.utils-wrap {
    border-top: 1px solid #919191;
    padding: 10px 10px 0;
    box-sizing: border-box;
    .title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
    }
    .add {
        cursor: pointer;
        font-size: 16px;
    }
    .util {
        cursor: pointer;
        font-size: 14px;
        padding: 10px 0;
        box-sizing: border-box;
    }
}
</style>
