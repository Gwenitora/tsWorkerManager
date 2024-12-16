import ThreadController, { CurrentThread } from "../../threads/worker";
import ThreadSetup from "../../threadSetup";

class App {
    public static get thread(): ThreadController<ThreadSetup.AllWorks.Websocket> {
        return CurrentThread();
    }

    public static Start() {}
}

export default App;