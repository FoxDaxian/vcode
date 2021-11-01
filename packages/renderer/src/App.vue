<template>
    <div id="app">
        <router-view></router-view>
        <!-- <img id="logo" src="~@/assets/logo.png" alt="electron-vue" /> -->
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
    name: 'App',
    components: {},
});
</script>

<style lang="less" scoped>
#app {
    background-color: red;
}
</style>
