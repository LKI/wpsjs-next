import React, { Component } from "react";
import { connect } from "react-redux";
import { getDocName, createTaskpane, newDoc, addString, closeDoc, setDemoSpan, openWeb } from "../actions/dialog";
import "./dialog.css";
import axios from "axios";

class Dialog extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    axios.get("/.debugTemp/NotifyDemoUrl").then((res) => {
      const { setDemoSpan } = this.props;
      setDemoSpan(res.data);
    });
  }

  onDocNameClick = () => {
    const { getDocName } = this.props;
    getDocName();
  };

  onCreateTaskpane = () => {
    const { createTaskpane } = this.props;
    createTaskpane();
  };

  onCreateDoc = () => {
    const { newDoc } = this.props;
    newDoc();
  };

  onAddString = () => {
    const { addString } = this.props;
    addString();
  };

  onCloseDoc = () => {
    const { closeDoc } = this.props;
    closeDoc();
  };

  onOpenWeb = () => {
    const { openWeb } = this.props;
    openWeb();
  };

  render() {
    const { docName, demoSpan } = this.props;

    return (
      <div>
        <div className="divItem">
          这是一个网页，按<span className="debug">"F12"</span>可以打开调试器。
        </div>
        <div className="divItem">
          这个示例展示了wps加载项的相关基础能力，与B/S业务系统的交互，请用浏览器打开：
          <span className="docs" onClick={this.onOpenWeb}>
            {demoSpan}
          </span>
        </div>
        <div className="divItem">
          开发文档: <span className="docs">https://open.wps.cn/docs/office</span>
        </div>
        <div>
          <button onClick={this.onDocNameClick}>取文件名</button>
          <button onClick={this.onCreateTaskpane}>创建任务窗格</button>
          <button onClick={this.onCreateDoc}>新建文件</button>
          <button onClick={this.onAddString}>文档开头添加字符串</button>
          <button onClick={this.onCloseDoc}>关闭文件</button>
        </div>
        <hr />
        <div>
          文档文件名为：<span>{docName}</span>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    docName: state.dialog.get("docName"),
    demoSpan: state.dialog.get("demoSpan"),
  };
};

export default connect(mapStateToProps, {
  getDocName,
  createTaskpane,
  newDoc,
  addString,
  closeDoc,
  setDemoSpan,
  openWeb,
})(Dialog);
