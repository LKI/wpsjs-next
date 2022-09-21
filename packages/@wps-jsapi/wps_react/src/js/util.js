//在后续的wps版本中，wps的所有枚举值都会通过wps.Enum对象来自动支持，现阶段先人工定义
var WPS_Enum = {
  msoCTPDockPositionLeft: 0,
  msoCTPDockPositionRight: 2,
};

function GetUrlPath() {
  let e = document.location.toString();
  e = decodeURI(e);
  if (-1 !== e.indexOf("/")) e = e.substring(0, e.lastIndexOf("/"));
  return e;
}

export default {
  WPS_Enum,
  GetUrlPath,
};
