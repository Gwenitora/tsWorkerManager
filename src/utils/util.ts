namespace Utils {
    export const JSON_clone = <T>(json: T): T => {
        return JSON.parse(JSON.stringify(json));
    };

    export const MPromise = <T>() => {
        let resolve: (value: T | PromiseLike<T>) => void = undefined as any;
        let reject: (reason?: any) => void = undefined as any;

        const promise = new Promise<T>((res, rej) => {
            resolve = res;
            reject = rej;
        });

        while (resolve === (undefined as any) || reject === (undefined as any)) {}

        return { promise, resolve, reject };
    }

    export const getTodayDate = () => {
        const date = new Date();
        return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1) < 10 ? '0' : ''}${(date.getUTCMonth() + 1)}-${(date.getUTCDate() + 1) < 10 ? '0' : ''}${date.getUTCDate()}`;
    }

    export const getNowTime = () => {
        const date = new Date();
        return `[${date.getUTCHours() < 10 ? '0' : ''}${date.getUTCHours()}:${date.getUTCMinutes() < 10 ? '0' : ''}${date.getUTCMinutes()}:${date.getUTCSeconds() < 10 ? '0' : ''}${date.getUTCSeconds()}] `;
    }
}

export default Utils;