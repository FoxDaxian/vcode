<template>
    <div class="page-content">
        <span>你好，我是西能的</span>
        <div class="n1">
            <div class="n2">
                <div class="n3">n31</div>
                <div class="n3">n32</div>
                <div class="n3">n33</div>
            </div>
            <div class="n21">
                <div class="n3">n231</div>
                <div class="n3">n232</div>
                <div class="n3">n233</div>
            </div>
        </div>
        <div class="jump" @click="jump">路由跳转</div>
    </div>
</template>

<script lang="ts" setup>
function jump() {
    console.log(123);
}
</script>

<style lang="less" scoped>
    span {
        color: red;
    }
</style>
