import ThreadSetup from "../threadSetup"

namespace ThreadT {
    export enum msgType {
        READY, // 0
        MESSAGE, // 1
        TASKS, // 2
        TASK, // 3
        REPLY_TASK, // 4
        REPLY_TASK_ERROR, // 5
        FINISH_TASKS // 6
    }
    export enum MessageStrenght {
        INFO,
        WARNING,
        ERROR
    }
    export enum taskType {
        CLASSIC,
        EACH
    }

    export type msgContent<T extends msgType> = (
        T extends msgType.MESSAGE
        ? { data: any, strenght: MessageStrenght }
        : (
            T extends msgType.TASKS
            ? tasks
            : (
                T extends msgType.TASK
                ? { taskname: string, data: any }
                : (
                    T extends msgType.REPLY_TASK
                    ? { data: any, fingerprint: string }
                    : (
                        T extends msgType.REPLY_TASK_ERROR
                        ? { fingerprint: string }
                        : (
                            T extends msgType.FINISH_TASKS
                            ? { data: any }
                            : undefined
                        )
                    )
                )
            )
        )
    )

    type beforePreContextType = string | boolean | number | undefined | null
    type preContextType = beforePreContextType | preContextType[] | { [key: string]: preContextType }
    export type contextType = {
        [key: string]: preContextType
    }

    export type getTasksName<T, V extends ThreadSetup.AllWorks, R = any> = {
        [K in keyof ThreadSetup.TaskFuncType[V]]: (ThreadSetup.TaskFuncType[V][K] extends (arg: T, ...args: any[]) => R ? K : never)
    }[keyof ThreadSetup.TaskFuncType[V]];

    export type task<IN_MAIN extends boolean = false> = {
        type: ThreadT.taskType,
        thread: ThreadSetup.AllWorks,
        taskname: string,
        callback: string
    } & (IN_MAIN extends true ? {
        entry: any,
        step: number,
        isGetted: boolean,
        getted?: any,
        isFinished: boolean,
        finished?: any,
        context: ThreadT.contextType
    } : {})
    export type tasks<IN_MAIN extends boolean = false> = {
        datas: any,
        context: ThreadT.contextType,
        tasks: ThreadT.task[]
    } & (IN_MAIN extends true ? {
        steps: ThreadT.task<true>[]
        baseWorker: ThreadSetup.AllWorks
    } : {})
}

export default ThreadT;