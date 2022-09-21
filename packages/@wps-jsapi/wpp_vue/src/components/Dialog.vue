<template>
  <div class="hello">
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
        <button style="margin: 3px" @click="onDocNameClick()">取文件名</button>
        <button style="margin: 3px" @click="onbuttonclick('createTaskPane')">创建任务窗格</button>
        <button style="margin: 3px" @click="onbuttonclick('newDoc')">新建文件</button>
        <button style="margin: 3px" @click="onbuttonclick('addString')">文档开头添加字符串</button>
      </div>
      <hr />
      <div class="divItem">
        文档文件名为：<span>{{ docName }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import dlgFunc from "./js/dialog.js";
import axios from "axios";
export default {
  name: "Dialog",
  data() {
    return {
      DemoSpan: "",
      docName: "",
    };
  },
  methods: {
    onbuttonclick(id) {
      return dlgFunc.onbuttonclick(id);
    },
    onDocNameClick() {
      this.docName = dlgFunc.onbuttonclick("getDocName");
    },
    onOpenWeb() {
      dlgFunc.onbuttonclick("openWeb", this.DemoSpan);
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
