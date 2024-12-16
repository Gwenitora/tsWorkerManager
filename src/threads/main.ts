import { Worker, isMainThread } from 'node:worker_threads';
import ThreadT from './types';
import colors from '../utils/colors';
import Utils from '../utils/util';
import ThreadSetup from '../threadSetup';
import path from 'node:path';
import { appendFileSync } from 'fs';
import { existsSync, mkdir } from 'node:fs';

class MainThreadController {
    private _workers: { [key in ThreadSetup.AllWorks]: Worker };
    private isRunning: boolean = true;
    private tasks: {
        [key: string]: ThreadT.tasks<true>
    } = {};

    get IsRunning() { return this.isRunning; }

    constructor() {
        if (!isMainThread) throw new Error('This class should only be instantiated in the main thread');
        this.setupFileLogging();
        this._workers = {} as any;
        for (const worker in ThreadSetup.AllWorks) {
            var w = parseFloat(worker);
            if (isNaN(w)) continue;
            this.setupThread(w);
        }

        console.log(`Main thread is now running..`);
    }

    private setupThread(worker: ThreadSetup.AllWorks) {
        this._workers[worker] = new Worker(`${ThreadSetup.prePath}${ThreadSetup.paths[worker]}${ThreadSetup.postPath}`, {});
        this._workers[worker].on('message', (msg) => this.receiveData(worker, msg));
        this._workers[worker].on('exit', () => {
            (() => {
                console.warn(`${ThreadSetup.AllWorksMinified[worker]}: Worker restarting..`);
                this.setupThread(worker);
            })();
        });
        this._workers[worker].on('error', (err) => {
            console.error(`${ThreadSetup.AllWorksMinified[worker]}: Error with worker:\n${err}`);
        });
    }

    private receiveData(worker: ThreadSetup.AllWorks, msg: string) {
        try {
            const json = JSON.parse(msg);
            switch (json.type) {
                case ThreadT.msgType.READY:
                    this.receiveReady(worker);
                    break;
                case ThreadT.msgType.MESSAGE:
                    this.receiveMessage(worker, json.data, json.strenght);
                    break;
                case ThreadT.msgType.TASKS:
                    this.receiveTasks(worker, json, json.fingerprint);
                    break;
                case ThreadT.msgType.REPLY_TASK:
                    this.receiveReplyTask(json.data, json.fingerprint);
                    break;
                case ThreadT.msgType.REPLY_TASK_ERROR:
                    this.receiveReplyTaskError(worker, json.fingerprint);
                    break;

                default:
                    this.receiveUnexistType(worker, json.type, JSON.stringify(json, null, 4));
                    break;
            }
        } catch (err) {
            console.error(`${ThreadSetup.AllWorksMinified[worker]}: Error when send a message to main thread:\n${msg}`);
        }
    }

    private receiveUnexistType(worker: ThreadSetup.AllWorks, type: string, content: string) {
        console.log(`${ThreadSetup.AllWorksMinified[worker]}: That type does not exist: ${colors.fg.red}${type}${colors.reset}\n${content}`);
    }

    private receiveReady(worker: ThreadSetup.AllWorks) {
        console.log(`${ThreadSetup.AllWorksMinified[worker]}: ${colors.fg.cyan}READY${colors.reset}`);
    }

    private receiveMessage(worker: ThreadSetup.AllWorks, msg: string, MessageStrenght: ThreadT.MessageStrenght) {
        (MessageStrenght === ThreadT.MessageStrenght.ERROR
            ? console.error
            : (MessageStrenght === ThreadT.MessageStrenght.WARNING
                ? console.warn
                : console.log
            ))(`${ThreadSetup.AllWorksMinified[worker]}: Message received:\n${msg}`);
    }

    private receiveTasks(worker: ThreadSetup.AllWorks, tasks: ThreadT.tasks, fingerprint: string) {
        console.log(`${ThreadSetup.AllWorksMinified[worker]}: Tasks received: ${colors.fg.cyan}${fingerprint}${colors.reset}`);
        if (tasks.tasks.length === 0) {
            console.log(`       ${colors.fg.red}No tasks${colors.reset}`);
            return;
        }
        tasks.tasks.forEach(task => {
            console.log(`       ${colors.fg.green}Task${colors.reset}: ${ThreadSetup.AllWorks[task.thread]}.${task.taskname}()`);
        });
        this.tasks[fingerprint] = {
            ...tasks,
            steps: [],
            baseWorker: worker
        };
        var newSTEP = this.tasks[fingerprint].tasks[0].type === ThreadT.taskType.CLASSIC ? [{
            ...this.tasks[fingerprint].tasks[0],
            entry: Utils.JSON_clone(this.tasks[fingerprint].datas),
            step: 0,
            isGetted: false,
            isFinished: false,
            context: Utils.JSON_clone(this.tasks[fingerprint].context)
        }] : (this.tasks[fingerprint].datas as any[]).map((e: any) => ({
            ...this.tasks[fingerprint].tasks[0],
            entry: Utils.JSON_clone(e),
            step: 0,
            isGetted: false,
            isFinished: false,
            context: Utils.JSON_clone(this.tasks[fingerprint].context)
        }));
        this.tasks[fingerprint].steps = [
            ...newSTEP,
            ...this.tasks[fingerprint].steps
        ]
        this.executeTask(fingerprint);
    }

    private receiveReplyTask(data: any, fingerprint: string) {
        const task = this.tasks[fingerprint];
        const step = task.steps[0];
        step.isGetted = true;
        step.getted = data;
        if (step.step === task.tasks.length - 1) {
            var cStep = step;
            cStep.isFinished = true;
            const { d, c } = new Function('d', 'c', `return (${cStep.callback})(d, c);`)(cStep.getted, cStep.context);
            cStep.finished = d;
            var nextIsEach = false;
            while (cStep.isFinished) {
                if (cStep.step === 0) {
                    this.finishTask(fingerprint, cStep.finished, task.baseWorker);
                    return;
                }
                var pStep = task.steps.find(s => s.step === cStep.step - 1);

                var toListFinished = false;
                if (pStep && pStep.finished === undefined) pStep.finished = [];
                const lastFinished = Utils.JSON_clone(pStep?.finished);
                if (nextIsEach && pStep) {
                    pStep.isFinished = pStep.finished.length + 1 >= pStep.getted.length;
                    var toListFinished = true;
                } else if (pStep) {
                    pStep.isFinished = true;
                }

                if (pStep) pStep.finished = cStep.finished;
                if (pStep?.type === ThreadT.taskType.CLASSIC) {
                    nextIsEach = false;
                } else if (pStep?.type === ThreadT.taskType.EACH) {
                    nextIsEach = true;
                }

                if (toListFinished && pStep) {
                    pStep.finished = [
                        pStep.finished,
                        ...lastFinished
                    ];
                }

                task.steps = task.steps.filter(s => s !== cStep);
                cStep = pStep === undefined ? {
                    isFinished: false,
                } as any : pStep;
            }
        } else {
            const { d, c } = new Function('d', 'c', `return (${step.callback})(d, c);`)(data, step.context);
            const newSTEP = task.tasks[step.step + 1].type === ThreadT.taskType.CLASSIC ? [{
                ...task.tasks[step.step + 1],
                entry: Utils.JSON_clone(d),
                step: step.step + 1,
                isGetted: false,
                isFinished: false,
                context: {
                    ...Utils.JSON_clone(step.context),
                    ...Utils.JSON_clone(c),
                }
            }] : d.map((e: any) => ({
                ...task.tasks[step.step + 1],
                entry: Utils.JSON_clone(e),
                step: step.step + 1,
                isGetted: false,
                isFinished: false,
                context: Utils.JSON_clone(c)
            }));
            task.steps = [
                ...newSTEP,
                ...task.steps
            ];
        }
        this.executeTask(fingerprint);
    }

    private executeTask(fingerprint: string) {
        const task = this.tasks[fingerprint];
        const step = task.steps[0];
        const worker = this._workers[step.thread];

        const sendWork = () => worker.postMessage(JSON.stringify({
            type: ThreadT.msgType.TASK,
            taskname: step.taskname,
            data: step.entry,
            fingerprint
        }));

        sendWork();
        // setTimeout(sendWork, 1000);
    }

    private finishTask(fingerprint: string, back: any, baseWorker: ThreadSetup.AllWorks) {
        const task = this.tasks[fingerprint];
        const worker = this._workers[task.baseWorker];

        worker.postMessage(JSON.stringify({
            type: ThreadT.msgType.FINISH_TASKS,
            fingerprint,
            data: back
        }));

        console.log(`${ThreadSetup.AllWorksMinified[baseWorker]}: Tasks finished: ${colors.fg.cyan}${fingerprint}${colors.reset}`);
    }

    private receiveReplyTaskError(worker: ThreadSetup.AllWorks, fingerprint: string) {
        const step = this.tasks[fingerprint].steps[0];
        console.log(`${ThreadSetup.AllWorksMinified[this.tasks[fingerprint].baseWorker]}: Task ${colors.fg.cyan}${fingerprint}${colors.reset} have an unexist Step: ${colors.fg.red}${ThreadSetup.AllWorks[step.type]}.${step.taskname}()${colors.reset}`);
        delete this.tasks[fingerprint];
    }

    private setupFileLogging() {
        console.clear();
        const log = console.log;
        const warn = console.warn;
        const error = console.error;
        console.log = (arg: any) => {
            log(this.logInFile(arg, ThreadT.MessageStrenght.INFO));
        };
        console.warn = (arg: any) => {
            warn(this.logInFile(arg, ThreadT.MessageStrenght.WARNING));
        };
        console.error = (arg: any) => {
            error(this.logInFile(arg, ThreadT.MessageStrenght.ERROR));
        };
    }

    private logInFile(msg: string, strenght: ThreadT.MessageStrenght) {
        msg = msg.replaceAll('\n ', '\n').replaceAll('\n', '\n        ');
        for (const worker in ThreadSetup.AllWorks) {
            var w = parseFloat(worker) as ThreadSetup.AllWorks;
            if (isNaN(w)) continue;
            const startMsg = ThreadSetup.AllWorksMinified[w];
            if (msg.startsWith(`${startMsg}: `)) {
                msg = msg.replace(
                    `${startMsg}: `, `${strenght === ThreadT.MessageStrenght.ERROR
                        ? colors.fg.red
                        : (strenght === ThreadT.MessageStrenght.WARNING
                            ? colors.fg.yellow
                            : colors.fg.green)
                    }${startMsg}${colors.reset}: `
                );
                const pureMessage = this.purifyMessage(msg);
                const file = path.join(ThreadSetup.loggerPath, `${ThreadSetup.paths[w]}`, `${Utils.getTodayDate()}.log`);
                this.writeInFile(file, pureMessage, strenght);
                return msg;
            }
        }
        msg = (
            `${strenght === ThreadT.MessageStrenght.ERROR
                ? colors.fg.red
                : (strenght === ThreadT.MessageStrenght.WARNING
                    ? colors.fg.yellow
                    : colors.fg.green
                )
            }MN${colors.reset}  : ${msg}`
        );
        const pureMessage = this.purifyMessage(msg);
        const file = path.join(ThreadSetup.loggerPath, `_Main_Thread`, `${Utils.getTodayDate()}.log`);
        this.writeInFile(file, pureMessage, strenght);
        return msg;
    }

    private purifyMessage(msg: string) {
        msg = msg

            .replaceAll(colors.fg.black, '')
            .replaceAll(colors.fg.red, '')
            .replaceAll(colors.fg.green, '')
            .replaceAll(colors.fg.yellow, '')
            .replaceAll(colors.fg.blue, '')
            .replaceAll(colors.fg.magenta, '')
            .replaceAll(colors.fg.cyan, '')
            .replaceAll(colors.fg.white, '')
            .replaceAll(colors.fg.gray, '')

            .replaceAll(colors.bg.black, '')
            .replaceAll(colors.bg.red, '')
            .replaceAll(colors.bg.green, '')
            .replaceAll(colors.bg.yellow, '')
            .replaceAll(colors.bg.blue, '')
            .replaceAll(colors.bg.magenta, '')
            .replaceAll(colors.bg.cyan, '')
            .replaceAll(colors.bg.white, '')
            .replaceAll(colors.bg.gray, '')

            .replaceAll(colors.blink, '')
            .replaceAll(colors.bright, '')
            .replaceAll(colors.dim, '')
            .replaceAll(colors.hidden, '')
            .replaceAll(colors.reset, '')
            .replaceAll(colors.reverse, '')
            .replaceAll(colors.underscore, '')

            .replaceAll(/\u001b\[38;2;\d+;\d+;\d+m/g, '')
            .replaceAll(/\u001b\[48;2;\d+;\d+;\d+m/g, '')

            .slice(6);

        while (msg.includes('\n '))
            msg = msg.replaceAll('\n ', '\n');

        return msg;
    }

    private writeInFile(file: string, msg: string, strenght: ThreadT.MessageStrenght) {
        msg = `${strenght === ThreadT.MessageStrenght.ERROR
            ? 'ERROR '
            : (strenght === ThreadT.MessageStrenght.WARNING
                ? 'WARN  '
                : 'INFO  '
            )
        }: ${msg.replaceAll('\n', `\n --${strenght === ThreadT.MessageStrenght.ERROR
            ? '-'
            : ' '
        }  : `)}`;
        const nowTime = Utils.getNowTime();
        msg = `${nowTime}${msg.replaceAll('\n', `\n${nowTime}`)}`;
        const direction = path.dirname(file).split('\\');
        var dir = '';
        for (const d of direction) {
            dir = path.join(dir, d);
            if (!existsSync(dir)) {
                mkdir(dir, () => { });
            }
        }
        if (!existsSync(file)) {
            appendFileSync(file, '');
        } else {
            msg = '\n' + msg;
        }
        appendFileSync(file, msg);
    }
}

export default MainThreadController;