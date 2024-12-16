import ThreadController, { CurrentThread } from "../../threads/worker";
import ThreadSetup from "../../threadSetup";

new ThreadController();
const thread = CurrentThread<ThreadSetup.AllWorks.API>();
export default thread;