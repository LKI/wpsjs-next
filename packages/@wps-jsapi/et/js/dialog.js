function onbuttonclick(idStr) {
  switch (idStr) {
    case "getDocName": {
      let doc = wps.EtApplication().ActiveWorkbook;
      let textValue = "";
      if (!doc) {
        textValue = textValue + "当前没有打开任何文档";
        return;
      }
      textValue = textValue + doc.Name;
      document.getElementById("text_p").innerHTML = textValue;
      break;
    }
    case "createTaskPane": {
      let tsId = wps.PluginStorage.getItem("taskpane_id");
      if (!tsId) {
        let tskpane = wps.CreateTaskPane(GetUrlPath() + "/taskpane.html");
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
  }
}

window.onload = () => {
  var xmlReq = WpsInvoke.CreateXHR();
  var url = location.origin + "/.debugTemp/NotifyDemoUrl";
  xmlReq.open("GET", url);
  xmlReq.onload = function (res) {
    var node = document.getElementById("DemoSpan");
    window.document.getElementById("DemoSpan").innerHTML = res.target.responseText;
  };
  xmlReq.send();
};
