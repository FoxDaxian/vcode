<template>
    <div id="main-content" ref="contentRef">
        <!-- 最左边是不是还需要一个区域，比如依赖可视化下载区 -->
        <!-- 搞好交互还得弄格式转换 -->
        <div class="left-content"></div>
        <div class="page-content">
            <!-- 根据路由匹配 -->
            <router-view></router-view>
        </div>
        <div class="right-content">操作区</div>
    </div>
</template>

<script lang="ts" setup>
</script>

<style lang="less" scoped>
</style>
