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
    case GETDOCNAME: {
      let doc = wps.WppApplication().ActivePresentation;
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
