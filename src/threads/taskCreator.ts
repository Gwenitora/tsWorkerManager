import ThreadSetup from "../threadSetup";
import Types from "../utils/types";
import ThreadT from "./types";
import ThreadController from "./worker";

class TasksCreator<T extends any, U extends boolean, SUB extends boolean = false, LLENGTH extends number = 0> {
    private tasks: ThreadT.task[];
    private fb!:  ThreadController<any>;
    private defaultData: any;
    private defaultContext: ThreadT.contextType;
    private sub: SUB;

    constructor() {
        this.defaultData = undefined;
        this.tasks = [];
        this.defaultContext = {};
        this.sub = false as SUB;
    }

    private Fallback(fb: ThreadController<any>) {
        this.fb = fb;
    }

    private setData(data: any): TasksCreator<T, U, SUB, LLENGTH> {
        this.defaultData = data;
        return this;
    }

    private setContext(context: ThreadT.contextType): TasksCreator<T, U, SUB, LLENGTH> {
        this.defaultContext = context;
        return this;
    }

    public newTask<V extends ThreadSetup.AllWorks, Y extends ThreadT.getTasksName<T, V>, X extends any = Types.ReturnType<ThreadSetup.TaskFuncType[V][Y]>>(
        thread: V,
        taskname: Y,
        callback: (d: Types.ReturnType<ThreadSetup.TaskFuncType[V][Y]>, c: ThreadT.contextType) => {d: X, c: ThreadT.contextType} = (d, c) => ({ d: d as any, c})
    ): TasksCreator<X, X extends any[] ? true : false, SUB, LLENGTH> {
        this.tasks.push({ type: ThreadT.taskType.CLASSIC, thread, taskname: taskname as string, callback: callback.toString() });
        return this as any;
    }

    public newEach<V extends ThreadSetup.AllWorks, Y extends ThreadT.getTasksName<Types.ContentOfList<T>, V>, X extends any = Types.ReturnType<ThreadSetup.TaskFuncType[V][Y]>>(
        thread: V,
        taskname: Y,
        callback: (d: Types.ReturnType<ThreadSetup.TaskFuncType[V][Y]>, c: ThreadT.contextType) => {d: X, c: ThreadT.contextType} = (d, c) => ({ d: d as any, c})
    ): U extends true ? TasksCreator<X, X extends any[] ? true : false, SUB, Types.Increment<LLENGTH> extends number ? Types.Increment<LLENGTH> : -10000000000> : never {
        this.tasks.push({ type: ThreadT.taskType.EACH, thread, taskname: taskname as string, callback: callback.toString() });
        return this as any;
    }

    public start(): Promise<SUB extends true ? Types.listExtendDistance<T, LLENGTH> : undefined> {
        const fingerprint = (this.fb as any).Post(ThreadT.msgType.TASKS, { context: this.defaultContext, tasks: this.tasks, datas: this.defaultData });
        if (!this.sub) return Promise.resolve(undefined as any);
        return (this.fb as any).TaskSubscribing(fingerprint);
    }

    public Subscribe() : TasksCreator<T, U, true, LLENGTH> {
        this.sub = true as SUB;
        return this as TasksCreator<T, U, true, LLENGTH>;
    }

    public Unsubscribe() : TasksCreator<T, U, false, LLENGTH> {
        this.sub = false as SUB;
        return this as TasksCreator<T, U, false, LLENGTH>;
    }
}

export default TasksCreator;