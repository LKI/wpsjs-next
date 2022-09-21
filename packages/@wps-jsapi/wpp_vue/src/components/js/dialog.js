import Util from "./util.js";

function onbuttonclick(idStr, param) {
  switch (idStr) {
    case "getDocName": {
      let doc = wps.WppApplication().ActivePresentation;
      if (!doc) {
        return "当前没有打开任何文档";
      }
      return doc.Name;
    }
    case "createTaskPane": {
      let tsId = wps.PluginStorage.getItem("taskpane_id");
      if (!tsId) {
        let tskpane = wps.CreateTaskPane(Util.GetUrlPath() + "taskpane");
        let id = tskpane.ID;
        wps.PluginStorage.setItem("taskpane_id", id);
        tskpane.Visible = true;
      } else {
        let tskpane = wps.GetTaskPane(tsId);
        tskpane.Visible = true;
      }
      break;
    }
    case "newDoc": {
      wps.WppApplication().Presentations.Add();
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
    case "openWeb": {
      wps.OAAssist.ShellExecute(param);
      break;
    }
  }
}

export default {
  onbuttonclick,
};
