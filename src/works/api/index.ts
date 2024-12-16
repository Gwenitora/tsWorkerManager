import ThreadController from "../../threads/worker";
import dotenv from 'dotenv';
import App from "./app";

dotenv.config();
new ThreadController();
App.Start();