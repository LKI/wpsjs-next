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
      let docName = wps.WpsApplication().ActiveDocument.Name;
      let newState = state.set("docName", docName);
      return newState;
    }
    case NEWDOC: {
      wps.WpsApplication().Documents.Add();
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
      let doc = wps.WpsApplication().ActiveDocument;
      if (doc) {
        doc.Range(0, 0).Text = "Hello, wps加载项!";
        //好像是wps的bug, 这两句话触发wps重绘
        let rgSel = wps.WpsApplication().Selection.Range;
        if (rgSel) rgSel.Select();
      }
      break;
    }
    case CLOSEDOC: {
      if (wps.WpsApplication().Documents.Count < 2) {
        alert("当前只有一个文档，别关了。");
        break;
      }

      let doc = wps.WpsApplication().ActiveDocument;
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
