import { DOCKLEFT, DOCKRIGHT, HIDETASKPANE, ADDSTRING, GETDOCNAME, SETDEMOSPAN, OPENWEB } from "../actions/taskpane";
import * as Immutable from "immutable";
import Util from "../js/util.js";

/* global wps:false */

const defaultState = Immutable.Map({
  docName: null,
  demoSpan: "waiting...",
});

export default function (state = defaultState, action) {
  switch (action.type) {
    case DOCKLEFT: {
      let tsId = wps.PluginStorage.getItem("taskpane_id");
      if (tsId) {
        let tskpane = wps.GetTaskPane(tsId);
        let value;
        if (wps.Enum) value = wps.Enum.msoCTPDockPositionLeft;
        else value = Util.WPS_Enum.msoCTPDockPositionLeft;
        tskpane.DockPosition = value;
      }
      break;
    }
    case DOCKRIGHT: {
      let tsId = wps.PluginStorage.getItem("taskpane_id");
      if (tsId) {
        let tskpane = wps.GetTaskPane(tsId);
        let value;
        if (wps.Enum) value = wps.Enum.msoCTPDockPositionRight;
        else value = Util.WPS_Enum.msoCTPDockPositionRight;
        tskpane.DockPosition = value;
      }
      break;
    }
    case HIDETASKPANE: {
      let tsId = wps.PluginStorage.getItem("taskpane_id");
      if (tsId) {
        let tskpane = wps.GetTaskPane(tsId);
        tskpane.Visible = false;
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
    case SETDEMOSPAN: {
      let newState = state.set("DemoSpan", action.data);
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
