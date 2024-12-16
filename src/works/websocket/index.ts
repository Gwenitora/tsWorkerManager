import ThreadController from "../../threads/worker";
import ThreadSetup from "../../threadSetup";

const thread = new ThreadController<ThreadSetup.AllWorks.Websocket>();
export default thread;