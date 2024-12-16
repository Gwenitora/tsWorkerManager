namespace ThreadSetup {
    // The default path to the logger file
    export const loggerPath: string = './logs'

    // All your works you wan't to created
    export enum AllWorks {
        Websocket,
        API
    }

    // Name of all works (full maj & exactly 4 letters or spaces, push all space at the end)
    // ⚠️Attention: 'MN  ' is reserved for the main thread
    export const AllWorksMinified: { [key in AllWorks]: string } = {
        [AllWorks.Websocket]: 'WS  ',
        [AllWorks.API]: 'API '
    }

    // The path of access to all works, you can setup a identically start & end for all your path, if you wan't to make totally different between all path, you can setup a prePath & postPath at ""
    // ⚠️Attention: '_Main_Thread' is reserved for the main thread
    export const prePath: string = './dist/works/'
    export const paths: { [key in AllWorks]: string } = {
        [AllWorks.Websocket]: 'websocket',
        [AllWorks.API]: 'api'
    }
    export const postPath: string = '/index.js'

    // All possibles task depending of the works, and everytime at the types: (value: any, ...args: never[]) => any
    // The names and typages is very important for easly create a chain of tasks, please make more precisly you can, thx
    // ⚠️⚠️IMPORTANT⚠️⚠️: If you get compile error on file 'src/threads/types.ts' like: "Type 'T' cannot be used to index type 'TaskFuncType'.", that signifie you need to add the new task in the TaskFuncType here
    export type TaskFuncType = {
        [AllWorks.Websocket]: {
        };
        [AllWorks.API]: {
        };
    };
}

export default ThreadSetup;