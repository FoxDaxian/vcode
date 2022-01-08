export default `
<template>
    <div class="main">
        <div class="text">hello world</div>
        <div v-if="false">if的第一个语句</div>
        <div v-else-if="true">第二个语句</div>
        <div v-else>else里的语句</div>
        
        <h1>我只是占位文本</h1>

        <h3 v-for="item in [1, 2, 3]">{{item}}</h3>
    </div>
</template>

<script lang="ts" setup>
</script>

<style lang="less" scoped>
    .text {
        color: red;
    }
</style>
`;
