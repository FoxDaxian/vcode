<template>
    <div class="components-wrap">
        <div class="title">components</div>
        <div
            :class="[
                'component',
                {
                    'component-selected':
                        activeComPath.replace(VmProfix, '') === comPath
                }
            ]"
            v-for="comPath in components"
            :key="comPath"
            @mousemove="mousemove($event, comPath)"
            @mouseleave="mouseleave"
            @mousedown.left="mousedown($event, comPath)"
        >
            {{ getComponentName(comPath) }}
        </div>
        <div
            class="comTemp"
            :style="{ left: `${left + 1}px`, top: `${top + 1}px` }"
            v-if="curDrag"
        >
            {{ getComponentName(curDrag) }}
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { getComponentName } from '../../../utils/';
import { GETALLCOM, VmProfix } from '../../../../utils/const/index';

const emits = defineEmits([
    'onMove',
    'onUp',
    'onComponentHover',
    'onComponentLeave'
]);
defineProps(['activeComPath']);

// 获取所有的组件
const components = ref<string[]>([]);
window.ipc.on(GETALLCOM, (event, data) => {
    components.value = data;
});

const canDrag = ref(false);
const curDrag = ref('');
const left = ref(0);
const top = ref(0);
function mousedown($event, comPath) {
    left.value = $event.clientX;
    top.value = $event.clientY;
    canDrag.value = true;
    curDrag.value = comPath;
}
document.body.addEventListener('mouseup', function ($event) {
    if (canDrag.value) {
        emits('onUp', $event.clientX, $event.clientY, curDrag.value);
        canDrag.value = false;
        curDrag.value = '';
    }
});

document.body.addEventListener('mousemove', function ($event) {
    if (canDrag.value) {
        left.value = $event.clientX;
        top.value = $event.clientY;
        emits('onMove', $event.clientX, $event.clientY, curDrag.value);
    }
});
function mousemove($event, comPath) {
    emits('onComponentHover', VmProfix + comPath);
}
function mouseleave() {
    emits('onComponentLeave');
}
</script>

<style lang="less" scoped>
.components-wrap {
    border-top: 1px solid #919191;
    padding: 10px 10px 0;
    box-sizing: border-box;
    .comTemp {
        font-size: 14px;
        position: fixed;
        width: fit-content;
        padding: 10px;
        text-align: center;
        color: #fff;
        background-color: #919191;
        border-radius: 4px;
    }
    .title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 10px;
    }
    .component {
        cursor: pointer;
        font-size: 14px;
        padding: 10px 0;
        box-sizing: border-box;
        border-bottom: 1px solid #919191;
    }
    .component-selected {
        outline: 5px solid #76b088;
    }
}
</style>
