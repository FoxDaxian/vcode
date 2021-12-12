<template>
    <div class="editor-wrap" v-if="visible">
        <div class="header-info">
            <input class="name" type="text" v-model="componentName" />
        </div>
        <div class="editor" ref="editor"></div>
        <div class="btns">
            <div class="confim" @click="_update">update</div>
            <div class="cancel" @click="cancel">close</div>
        </div>
    </div>
</template>
<script lang="ts">
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export default defineComponent({
    name: 'myEditor',
    emits: ['destroy'],
    props: {
        pos: {
            type: Array,
            defaylt() {
                return [];
            }
        },
        id: {
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
        // 得改成path对应的id了
        props: {
            update: ({ parent: string, child: string, source: string }) => void;
            cancel: () => void;
            id: string;
        },
        context: { emit: () => void }
    ) {
        const visible = ref(true);
        const componentName = ref('');

        const close = () => {
            visible.value = false;
            context.emit('destroy');
        };

        const editor = ref(null);

        const templateVal = [
            '<template>',
            '    <input type="hidden" class="hidden">',
            '    <div>我是被用户编辑后插入的</div>',
            '    <div><h2>是的</h2></div>',
            '</template>',
            '<style lang="less" scoped>',
            '.hidden {',
            '    display: none;',
            '}',
            '</style>'
        ].join('\n');
        onMounted(async () => {
            await nextTick();
            monaco.editor.create(editor.value, {
                value: templateVal,
                language: 'typescript',
                theme: 'vs-dark'
            });
        });
        const _update = () => {
            if (!componentName.value) {
                return;
            }
            props.update({
                pos: props.pos,
                id: props.id,
                child: componentName.value,
                source: templateVal
            });
        };

        return {
            _update,
            componentName,
            editor,
            close,
            visible,
            templateVal
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
    width: 50vw;
    height: 50vh;
    display: flex;
    flex-direction: column;
}
.header-info {
    box-sizing: border-box;
    padding: 10px 0;
    input {
        width: 100%;
        height: 30px;
        border: 1px solid #ccc;
        border-radius: 5px;
    }
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
