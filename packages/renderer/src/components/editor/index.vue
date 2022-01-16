<template>
    <div class="editor-wrap" v-if="visible">
        <div class="header-info">
            <ElInput
                v-if="insertOrNew"
                placeholder="route path"
                v-model="routePath"
            >
                <template #prepend>{{ parentRoutePath }}</template>
            </ElInput>
            <ElInput
                v-if="insertOrNew"
                placeholder="route name"
                v-model="routeName"
            ></ElInput>
            <ElInput
                placeholder="component name"
                v-model="componentName"
                :disabled="componentName === 'mainContent'"
            ></ElInput>
        </div>
        <Base :sourceText="sourceText" @getResult="getResult" />
        <div class="btns">
            <div class="confim" @click="ipcUpdate">update</div>
            <div class="cancel" @click="cancel">close</div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ElInput } from 'element-plus';
import { ref } from 'vue';
import Base from './base.vue';

const props = defineProps([
    'insertOrNew',
    'parentRoutePath',
    'id',
    'sourceText',
    'update',
    'cancel'
]);
const emit = defineEmits(['destroy']);

const visible = ref(true);
const fileName = props.id.split('/').pop().split('.')[0];
const componentName = ref(fileName);
const routeName = ref('');
const routePath = ref('');

const close = () => {
    visible.value = false;
    emit('destroy');
};
const code = ref<string>(props.sourceText);
function getResult(result) {
    code.value = result;
}

const ipcUpdate = () => {
    if (!componentName.value) {
        return;
    }
    props.update({
        routePath: routePath.value,
        routeName: routeName.value,
        child: componentName.value,
        source: code.value
    });
};
</script>
<style lang="less" scoped>
.editor-wrap {
    box-sizing: border-box;
    position: absolute;
    bottom: 0;
    top: 0;
    left: 0;
    right: 0;
    margin: auto;
    width: 70vw;
    height: 70vh;
    display: flex;
    flex-direction: column;
}
.header-info {
    box-sizing: border-box;
    padding: 10px 0;
}
.btns {
    height: 32px;
    line-height: 32px;
    display: flex;
}
.confim {
    border: 1px solid #0066ff;
    padding: 0 12px;
    color: #0066ff;
    cursor: pointer;
    text-align: center;

    box-sizing: border-box;
    border-radius: 4px;
    font-size: 14px;
}
.cancel {
    border: 1px solid #0066ff;
    padding: 0 12px;
    color: #0066ff;
    cursor: pointer;
    text-align: center;

    box-sizing: border-box;
    border-radius: 4px;
    font-size: 14px;
}
</style>
