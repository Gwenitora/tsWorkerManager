import ThreadController, { CurrentThread } from "../../threads/worker";
import ThreadSetup from "../../threadSetup";
import dotenv from 'dotenv';

dotenv.config();
new ThreadController();
const thread = CurrentThread<ThreadSetup.AllWorks.Websocket>();
export default thread;