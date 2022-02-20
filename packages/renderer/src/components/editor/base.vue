<template>
    <div class="editor" ref="editor"></div>
</template>
<script lang="ts" setup>
import { ref, watch } from 'vue';
// TODO: 支持高亮 + lsp以提供自动补全等功能 + 定位方法的时候要和vcode的路径配合上
// https://langserver.org/ 看看这个官网
// https://github.com/vuejs/vetur/issues/1377 how to use vetur in monaco
// https://github.com/microsoft/monaco-editor/issues/1630 same as above
// monaco-editor/min/vs/editor/editor.main
// import * as monaco from 'monaco-editor/esm/vs/editor/editor.main';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import './theme';

const props = defineProps(['sourceText']);
const emit = defineEmits(['getResult']);

const editor = ref(null);
// 如何提供高亮，和智能提示和一些快捷键

const code = ref(props.sourceText);
watch(editor, (editor) => {
    const e = monaco.editor.create(editor, {
        model: monaco.editor.createModel(code.value, 'html'),
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
