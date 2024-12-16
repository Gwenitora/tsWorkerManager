import { isMainThread, parentPort } from "node:worker_threads";
import ThreadT from "./types";
import ThreadU from "./util";
import TasksCreator from "./taskCreator";
import Utils from "../utils/util";
import Types from "../utils/types";
import ThreadSetup from "../threadSetup";

class ThreadController<T extends ThreadSetup.AllWorks> {
    private tasks: {
        [key: string]: (value: any) => any
    } = {};

    private taskSubsribed: {
        [key: string]: Types.ReturnType<typeof Utils.MPromise<any>>
    } = {};

    constructor() {
        if (isMainThread) throw new Error('This class should only be instantiated in the not main threads')

        console.log = (...args: any[]) => {
            this.Post(ThreadT.msgType.MESSAGE, { data: args.map(arg => JSON.stringify(arg, null, 4)), strenght: ThreadT.MessageStrenght.INFO });
        };
        console.warn = (...args: any[]) => {
            this.Post(ThreadT.msgType.MESSAGE, { data: args.map(arg => JSON.stringify(arg, null, 4)), strenght: ThreadT.MessageStrenght.WARNING });
        };
        console.error = (...args: any[]) => {
            this.Post(ThreadT.msgType.MESSAGE, { data: args.map(arg => JSON.stringify(arg, null, 4)), strenght: ThreadT.MessageStrenght.ERROR });
        };

        parentPort?.on('message', (msg) => this.receiveData(msg));

        this.Post(ThreadT.msgType.READY, undefined);
    }

    private Post<T extends ThreadT.msgType>(type: T, msg: ThreadT.msgContent<T>): string {
        if (msg === undefined) msg = {} as any;
        (msg as any).type = type;
        if ((msg as any).fingerprint === undefined) (msg as any).fingerprint = ThreadU.newFingerprint();
        var MSG: string = JSON.stringify(msg);
        parentPort?.postMessage(MSG);
        return (msg as any).fingerprint;
    }

    private TaskSubscribing(fingerprint: string) {
        this.taskSubsribed[fingerprint] = Utils.MPromise();
        return this.taskSubsribed[fingerprint].promise;
    }

    private receiveData(msg: string) {
        try {
            const task = JSON.parse(msg);
            if (task.type !== ThreadT.msgType.TASK) {
                if (task.type !== ThreadT.msgType.FINISH_TASKS) return;
                this.taskSubsribed[task.fingerprint]?.resolve(task.data);
                delete this.taskSubsribed[task.fingerprint];
                return;
            }
            if (!this.tasks[task.taskname]) {
                this.Post(ThreadT.msgType.REPLY_TASK_ERROR, { fingerprint: task.fingerprint });
                return;
            }
            this.tasks[task.taskname](task.data).then((res: any) => {
                this.Post(ThreadT.msgType.REPLY_TASK, { data: res, fingerprint: task.fingerprint });
            });
        } catch (err) {
            console.error(msg);
        }
    }

    public createTasks<U>(datas: U, context: ThreadT.contextType = {}): TasksCreator<U, U extends any[] ? true : false> {
        const TaskC = new TasksCreator<U, U extends any[] ? true : false>();
        (TaskC as any).Fallback(this);
        (TaskC as any).setData(datas);
        (TaskC as any).setContext(context);
        return TaskC;
    }

    public addTask<U extends keyof ThreadSetup.TaskFuncType[T], V extends ThreadSetup.TaskFuncType[T][U]>(name: U, callback: V) {
        this.tasks[name.toString()] = async (value: any) => (await callback as Function)(value);
    }
}

export default ThreadController;