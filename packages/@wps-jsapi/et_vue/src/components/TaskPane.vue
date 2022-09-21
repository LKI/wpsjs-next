<template>
  <div class="global">
    <div class="divItem">这是一个网页，按<span style="font-weight: bolder">"F12"</span>可以打开调试器。</div>
    <div class="divItem">
      这个示例展示了wps加载项的相关基础能力，与B/S业务系统的交互，请用浏览器打开：
      <span style="font-weight: bolder; color: slateblue; cursor: pointer" @click="onOpenWeb()">{{ DemoSpan }}</span>
    </div>
    <div class="divItem">
      开发文档: <span style="font-weight: bolder; color: slateblue">https://open.wps.cn/docs/office</span>
    </div>
    <hr />
    <div class="divItem">
      <button style="margin: 3px" @click="onbuttonclick('dockLeft')">停靠左边</button>
      <button style="margin: 3px" @click="onbuttonclick('dockRight')">停靠右边</button>
      <button style="margin: 3px" @click="onbuttonclick('hideTaskPane')">隐藏TaskPane</button>
      <button style="margin: 3px" @click="onbuttonclick('addString')">文档开头添加字符串</button>
      <button style="margin: 3px" @click="onDocNameClick()">取文件名</button>
    </div>
    <hr />
    <div class="divItem">
      文档文件名为：<span>{{ docName }}</span>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import taskPane from "./js/taskpane.js";
export default {
  name: "TaskPane",
  data() {
    return {
      DemoSpan: "",
      docName: "",
    };
  },
  methods: {
    onbuttonclick(id) {
      return taskPane.onbuttonclick(id);
    },
    onDocNameClick() {
      this.docName = taskPane.onbuttonclick("getDocName");
    },
    onOpenWeb() {
      taskPane.onbuttonclick("openWeb", this.DemoSpan);
    },
  },
  mounted() {
    axios.get("/.debugTemp/NotifyDemoUrl").then((res) => {
      this.DemoSpan = res.data;
    });
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.global {
  font-size: 15px;
  min-height: 95%;
}
.divItem {
  margin-left: 5px;
  margin-bottom: 18px;
  font-size: 15px;
  word-wrap: break-word;
}
</style>
