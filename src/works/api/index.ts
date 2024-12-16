import ThreadController from "../../threads/worker";
import ThreadSetup from "../../threadSetup";

const thread = new ThreadController<ThreadSetup.AllWorks.API>();
export default thread;