export const GETDOCNAME = "getDocName";
export const CREATETASKPANE = "createTaskpane";
export const NEWDOC = "newDoc";
export const ADDSTRING = "addString";
export const CLOSEDOC = "closeDoc";
export const SETDEMOSPAN = "setDemoSpan";
export const OPENWEB = "openWeb";

export function getDocName(data) {
  return { type: GETDOCNAME, data };
}

export function createTaskpane(data) {
  return { type: CREATETASKPANE, data };
}

export function newDoc(data) {
  return { type: NEWDOC, data };
}

export function addString(data) {
  return { type: ADDSTRING, data };
}

export function closeDoc(data) {
  return { type: CLOSEDOC, data };
}

export function setDemoSpan(data) {
  return { type: SETDEMOSPAN, data };
}

export function openWeb(data) {
  return { type: OPENWEB, data };
}
