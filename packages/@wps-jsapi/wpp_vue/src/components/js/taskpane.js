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
      let doc = wps.WppApplication().ActivePresentation;
      if (doc) {
        if (doc.Slides.Item(1)) {
          let shapes = doc.Slides.Item(1).Shapes;
          let shape = null;
          if (shapes.Count > 0) {
            shape = shapes.Item(1);
          } else {
            shape = shapes.AddTextbox(2, 20, 20, 300, 300);
          }
          if (shape) {
            shape.TextFrame.TextRange.Text = "Hello, wps加载项!" + shape.TextFrame.TextRange.Text;
          }
        }
      }
      break;
    }
    case "getDocName": {
      let doc = wps.WppApplication().ActivePresentation;
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
