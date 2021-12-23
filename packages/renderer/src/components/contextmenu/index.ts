import type { App, VNodeProps, ComponentInternalInstance } from 'vue';
import { createVNode, render } from 'vue';
import type { VNode, ComponentPublicInstance } from 'vue';
import Index from './index.vue';

type Data = Record<string, unknown>;

export default {
    install: (app: App) => {
        app.config.globalProperties.$openContextmenu = (
            param: VNodeProps | Data
        ) => {
            const container: HTMLElement = document.createElement('div');

            const vm: VNode = createVNode(Index, param);
            render(vm, container);
            (vm.props = vm.props || {}).onDestroy = () => {
                render(null, container);
            };

            document.body.appendChild(container.firstElementChild as Node);

            return () => {
                (
                    (vm.component as ComponentInternalInstance)
                        .proxy as ComponentPublicInstance<{
                        close: () => void;
                    }>
                ).close();
            };
        };
    }
};
