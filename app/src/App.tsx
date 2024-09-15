import "./App.css";
import CardTask from "./components/card-task";
import CreateNewTimer from "./components/create-new-timer";
import ListTimers from "./components/list-timers";

function App() {
  return (
    <div className="container">
      <CreateNewTimer></CreateNewTimer>
      <CardTask />
      <ListTimers></ListTimers>
    </div>
  );
}

export default App;
