import ThreadController, { CurrentThread } from "../../threads/worker";
import ThreadSetup from "../../threadSetup";

class App {
    public static get thread(): ThreadController<ThreadSetup.AllWorks.API> {
        return CurrentThread();
    }

    public static Start() {}
}

export default App;