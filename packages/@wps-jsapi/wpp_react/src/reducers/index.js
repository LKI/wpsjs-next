import { combineReducers } from "redux";
import dialog from "./dialog";
import taskpane from "./taskpane";

const rootReducer = combineReducers({
  dialog,
  taskpane,
});

export default rootReducer;
