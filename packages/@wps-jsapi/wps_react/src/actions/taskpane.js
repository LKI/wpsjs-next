export const DOCKLEFT = "dockLeft";
export const DOCKRIGHT = "dockRight";
export const HIDETASKPANE = "hideTaskPane";
export const ADDSTRING = "addString";
export const GETDOCNAME = "getDocName";
export const SETDEMOSPAN = "setDemoSpan";
export const OPENWEB = "openWeb";

export function dockLeft(data) {
  return { type: DOCKLEFT, data };
}

export function dockRight(data) {
  return { type: DOCKRIGHT, data };
}

export function hideTaskPane(data) {
  return { type: HIDETASKPANE, data };
}

export function addString(data) {
  return { type: ADDSTRING, data };
}

export function getDocName(data) {
  return { type: GETDOCNAME, data };
}

export function setDemoSpan(data) {
  return { type: SETDEMOSPAN, data };
}

export function openWeb(data) {
  return { type: OPENWEB, data };
}
