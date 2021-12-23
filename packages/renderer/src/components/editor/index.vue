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
        <div class="editor" ref="editor"></div>
        <div class="btns">
            <div class="confim" @click="ipcUpdate">update</div>
            <div class="cancel" @click="cancel">close</div>
        </div>
    </div>
</template>
<script lang="ts">
import { ElInput } from 'element-plus';
import { defineComponent, ref, onMounted, nextTick } from 'vue';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export default defineComponent({
    name: 'myEditor',
    emits: ['destroy'],
    components: {
        ElInput
    },
    props: {
        insertOrNew: {
            type: String,
            default: ''
        },
        parentRoutePath: {
            type: String,
            default: ''
        },
        id: {
            type: String,
            default: ''
        },
        sourceText: {
            type: String,
            default: ''
        },
        update: {
            type: Function,
            default() {
                /** */
            }
        },
        cancel: {
            type: Function,
            default() {
                /** */
            }
        }
    },
    setup(
        props: {
            update: ({ child: string, source: string }) => void;
            cancel: () => void;
        },
        context: { emit: () => void }
    ) {
        const visible = ref(true);
        const fileName = props.id.split('/').pop().split('.')[0];
        const componentName = ref(fileName);
        const routeName = ref('');
        const routePath = ref('');

        const close = () => {
            visible.value = false;
            context.emit('destroy');
        };

        const editor = ref(null);

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
            });
        });
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

        return {
            routeName,
            routePath,
            ipcUpdate,
            componentName,
            editor,
            close,
            visible
        };
    }
});
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
.editor {
    flex: 1;
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
