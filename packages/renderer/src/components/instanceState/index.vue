<template>
    <div v-if="componentName">
        <div class="component-name-box">
            <span>&lt;</span>
            <span class="name">{{ componentName.replace('.vue', '') }}</span>
            <span>&gt;</span>
        </div>
        <div class="component-state-box">
            <div
                class="component-state-item"
                v-for="(states, index) in instanceStates"
                :key="index"
            >
                <div class="component-state-title" v-if="states.length">
                    {{ stateType[index] }}
                </div>
                <div
                    class="component-state-flex"
                    v-for="state in states"
                    :key="state.key"
                >
                    <div class="component-state-name">
                        {{ state.key }}:&nbsp;
                    </div>
                    <input
                        class="component-state-value"
                        v-model="
                            curComInstance.devtoolsRawSetupState[state.key]
                        "
                        v-if="state.editable"
                    />
                    <div class="component-state-value" v-else>
                        {{ state.value }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
export const stateType = [
    'setup',
    'setup (other)',
    'data',
    'props',
    'refs',
    'attrs',
    'injected',
    'provided',
    'invalid'
];
</script>

<script lang="ts" setup>
defineProps(['componentName', 'instanceStates', 'curComInstance']);
</script>

<style lang="less" scoped>
.component-name-box {
    box-sizing: border-box;
    padding: 10px 0;
    color: #4d5962;
    .name {
        color: #63b284;
    }
}
.component-state-box {
    .component-state-item {
        box-sizing: border-box;
    }
    .component-state-title {
        width: 100%;
        padding-top: 10px;
        border-top: 1px dashed #4a4a4a;
        color: #7a94b1;
        margin-top: 10px;
    }
    .component-state-flex {
        margin-top: 10px;
        display: flex;
        align-items: center;
    }
    .component-state-name {
        color: #bc9de6;
    }
    .component-state-value {
        width: 100%;
        color: #d24c42;
    }
    input.component-state-value {
        border: 1px solid #4a4a4a;
        padding: 4px;
        box-sizing: border-box;
        outline: none;
    }
}
</style>
