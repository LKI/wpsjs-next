import { GETDOCNAME, CREATETASKPANE, NEWDOC, ADDSTRING, CLOSEDOC, SETDEMOSPAN, OPENWEB } from "../actions/dialog";
import * as Immutable from "immutable";
import Util from "../js/util.js";

/* global wps:false */

const defaultState = Immutable.Map({
  docName: null,
  demoSpan: "waiting...",
});

export default function (state = defaultState, action) {
  switch (action.type) {
    case GETDOCNAME: {
      let doc = wps.EtApplication().ActiveWorkbook;
      let textValue;
      if (!doc) {
        textValue = "当前没有打开任何文档";
      } else {
        textValue = doc.Name;
      }
      let newState = state.set("docName", textValue);
      return newState;
    }
    case NEWDOC: {
      wps.EtApplication().Workbooks.Add();
      break;
    }
    case CREATETASKPANE: {
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
    case ADDSTRING: {
      let curSheet = wps.EtApplication().ActiveSheet;
      if (curSheet) {
        curSheet.Cells.Item(1, 1).Formula = "Hello, wps加载项!" + curSheet.Cells.Item(1, 1).Formula;
      }
      break;
    }
    case CLOSEDOC: {
      if (wps.EtApplication().Workbooks.Count < 2) {
        alert("当前只有一个文档，别关了。");
        break;
      }

      let doc = wps.EtApplication().ActiveWorkbook;
      if (doc) doc.Close();
      break;
    }
    case SETDEMOSPAN: {
      let newState = state.set("demoSpan", action.data);
      return newState;
    }
    case OPENWEB: {
      let param = state.get("demoSpan");
      wps.OAAssist.ShellExecute(param);
    }
    default:
  }
  return state;
}
