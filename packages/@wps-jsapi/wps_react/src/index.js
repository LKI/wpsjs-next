import React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Route, Switch } from "react-router-dom";
import App from "./components/app";
import Dialog from "./components/dialog";
import TaskPane from "./components/taskpane";
import { Provider } from "react-redux";
import { createStore } from "redux";
import rootReducer from "./reducers";

const store = createStore(rootReducer, window.STATE_FROM_SERVER);

ReactDOM.render(
  <Provider store={store}>
    <HashRouter>
      <Switch>
        <Route path="/" exact component={App} />
        <Route path="/dialog" exact component={Dialog} />
        <Route path="/taskpane" exact component={TaskPane} />
      </Switch>
    </HashRouter>
  </Provider>,
  document.getElementById("root")
);
