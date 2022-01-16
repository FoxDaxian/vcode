<template>
    <div class="editor" ref="editor"></div>
</template>
<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

const props = defineProps(['sourceText']);
const emit = defineEmits(['getResult']);

const editor = ref(null);
// 如何提供高亮，和智能提示和一些快捷键

const code = ref(props.sourceText);
onMounted(async () => {
    await nextTick();
    const e = monaco.editor.create(editor.value, {
        value: code.value,
        language: 'typescript',
        theme: 'vs-dark'
    });
    e.onDidChangeModelContent(() => {
        code.value = e.getValue();
        emit('getResult', code.value);
    });
});
</script>
<style lang="less" scoped>
.editor {
    flex: 1;
}
</style>
