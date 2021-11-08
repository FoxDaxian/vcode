<template>
    <div class="main-content" ref="contentRef">
        <!-- 最左边是不是还需要一个区域，比如依赖可视化下载区 -->
        <!-- 搞好交互还得弄格式转换 -->
        <div class="left-content">依赖下载等操作取悦</div>
        <div class="page-content">
            操作区域
            <!-- 根据路由匹配 -->
            <router-view></router-view>
        </div>
        <div class="right-content">
            当前模块环境上下文，作用域？ 模块汇总区域?
        </div>
    </div>
</template>

<script lang="ts" setup>
// 思路一：再启动一个vite或者react等，然后操作的部分是src 但是，你要怎么操作呢？
// 嵌入一些生成内容的script？
// 在主render加一层遮罩？那滚动条怎么处理

// 思路二：操作ast，但是这个ast是文件层面的ast，而不仅仅是代码层面的


// 也得支持组件拖拽之类的，或者搜索后直接放那也行

// 按照正常的思考来，怎么初始化一个vue或者react项目？先简单些来，先弄vue的，需要做的通用些，方便之后的扩展
// 换句话来说，就是产出什么样的代码或直接dist产物？然后 怎么 产出？
// 我想改用户在页面上直接编写组件（这个组件其实只是一个内容，可以转成组件也可以保持不动），那是不是同样需要css scope?
// 解析模板的时候不一定动态，也可以根据不同模板使用不同方式，也就是搞映射map
// 接口怎么搞？公共配置怎么搞？类型之类的怎么搞？
// 还得找一个支持ts、esling这类的编辑器嵌入进来
// 不同文件要展示不同内容？比如.vue、.jsx或.html展示页面，ts、js这类展示代码？
// 还需要全局数据进行通信？
</script>

<style lang="less" scoped>
.main-content {
    height: 100%;
    display: flex;
}
.page-content {
    flex-grow: 1;
    background-color: green;
}
.left-content,
.right-content {
    width: 20%;
}
</style>
