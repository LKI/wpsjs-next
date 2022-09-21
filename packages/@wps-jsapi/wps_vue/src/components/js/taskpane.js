import Util from "./util.js";

function onbuttonclick(idStr, param) {
  if (typeof wps.Enum != "object") {
    // 如果没有内置枚举值
    wps.Enum = Util.WPS_Enum;
  }
  switch (idStr) {
    case "dockLeft": {
      let tsId = wps.PluginStorage.getItem("taskpane_id");
      if (tsId) {
        let tskpane = wps.GetTaskPane(tsId);
        tskpane.DockPosition = wps.Enum.msoCTPDockPositionLeft;
      }
      break;
    }
    case "dockRight": {
      let tsId = wps.PluginStorage.getItem("taskpane_id");
      if (tsId) {
        let tskpane = wps.GetTaskPane(tsId);
        tskpane.DockPosition = wps.Enum.msoCTPDockPositionRight;
      }
      break;
    }
    case "hideTaskPane": {
      let tsId = wps.PluginStorage.getItem("taskpane_id");
      if (tsId) {
        let tskpane = wps.GetTaskPane(tsId);
        tskpane.Visible = false;
      }
      break;
    }
    case "addString": {
      let doc = wps.WpsApplication().ActiveDocument;
      if (doc) {
        doc.Range(0, 0).Text = "Hello, wps加载项!";
        //好像是wps的bug, 这两句话触发wps重绘
        let rgSel = wps.WpsApplication().Selection.Range;
        if (rgSel) rgSel.Select();
      }
      break;
    }
    case "getDocName": {
      let doc = wps.WpsApplication().ActiveDocument;
      if (!doc) {
        return "当前没有打开任何文档";
      }
      return doc.Name;
    }
    case "openWeb": {
      wps.OAAssist.ShellExecute(param);
      break;
    }
  }
}

export default {
  onbuttonclick,
};
