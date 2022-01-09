export default `
<template>
    <div class="main">
        <div class="text">hello world</div>
        
        <h1>我只是占位文本</h1>
        <input v-model="s" />
        {{s}}
        {{com}}
    </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
const s = ref(123);
const com = computed(() => s);
</script>

<style lang="less" scoped>
    .text {
        color: red;
    }
</style>
`;
