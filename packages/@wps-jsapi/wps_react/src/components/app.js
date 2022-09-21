import React, { Component } from "react";
import ribbon from "./ribbon";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    console.log("init ribbon");
    window.ribbon = ribbon;
  }

  render() {
    return <div>this is index.html</div>;
  }
}

export default App;
