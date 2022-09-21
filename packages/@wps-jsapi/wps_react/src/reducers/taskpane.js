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
      let doc = wps.WpsApplication().ActiveDocument;
      if (doc) {
        doc.Range(0, 0).Text = "Hello, wps加载项!";
        //好像是wps的bug, 这两句话触发wps重绘
        let rgSel = wps.WpsApplication().Selection.Range;
        if (rgSel) rgSel.Select();
      }
      break;
    }
    case GETDOCNAME: {
      let docName = wps.WpsApplication().ActiveDocument.Name;
      let newState = state.set("docName", docName);
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
