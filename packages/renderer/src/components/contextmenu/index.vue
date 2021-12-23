<template>
    <div class="contextmenu-wrap" v-if="visible" @click="close">
        <div class="context-menu" :style="{ top: `${y}px`, left: `${x}px` }">
            <div
                v-for="(menu, index) in menuItems"
                :key="index"
                class="menu-item"
                @click="menu.callback"
            >
                {{ menu.label }}
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';

export default defineComponent({
    name: 'myContextmenu',
    emits: ['destroy'],
    props: {
        x: {
            type: Number,
            default: 0
        },
        y: {
            type: Number,
            default: 0
        },
        menuItems: {
            type: Array,
            default() {
                return [];
            }
        }
        // onTrigger: {
        //     type: Function,
        //     default: () => {
        //         //
        //     }
        // }
    },
    setup(
        props: {
            update: ({ child: string, source: string }) => void;
            cancel: () => void;
        },
        context: { emit: () => void }
    ) {
        const visible = ref(true);
        const close = () => {
            visible.value = false;
            context.emit('destroy');
        };
        function escape(e: KeyboardEvent) {
            if (e.keyCode === 27) {
                close();
            }
        }
        onMounted(() => {
            document.addEventListener('keydown', escape);
        });
        onUnmounted(() => {
            document.removeEventListener('keydown', escape);
        });

        return {
            close,
            visible
        };
    }
});
</script>
<style lang="less" scoped>
.contextmenu-wrap {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
}
.context-menu {
    position: absolute;
    box-sizing: border-box;
    padding: 5px 0;
    background-color: #838484;
    border-radius: 4px;
    box-shadow: 2px 2px 8px 0 #838484;
    font-size: 14px;
    white-space: nowrap;
}
.menu-item {
    font-weight: bold;
    padding: 5px 20px;
    line-height: 1;
    color: #fff;
    cursor: pointer;
}
.menu-item:hover {
    background-color: #46a0fc;
}
</style>
