import Util from "./util.js";

function onbuttonclick(idStr, param) {
  switch (idStr) {
    case "getDocName": {
      let doc = wps.EtApplication().ActiveWorkbook;
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
      wps.EtApplication().Workbooks.Add();
      break;
    }
    case "addString": {
      let curSheet = wps.EtApplication().ActiveSheet;
      if (curSheet) {
        curSheet.Cells.Item(1, 1).Formula = "Hello, wps加载项!" + curSheet.Cells.Item(1, 1).Formula;
      }
      break;
    }
    case "closeDoc": {
      if (wps.EtApplication().Workbooks.Count < 2) {
        alert("当前只有一个文档，别关了。");
        break;
      }

      let doc = wps.EtApplication().ActiveWorkbook;
      if (doc) doc.Close();
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
