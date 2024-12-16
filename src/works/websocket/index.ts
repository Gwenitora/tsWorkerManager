import ThreadController, { CurrentThread } from "../../threads/worker";
import ThreadSetup from "../../threadSetup";

new ThreadController();
const thread = CurrentThread<ThreadSetup.AllWorks.Websocket>();
export default thread;