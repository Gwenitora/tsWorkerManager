import Types from "./types";

/**
 * Namespace tool for make colors in console and for save as `rgb`, `rgba`, `hsv`, `hsva`
 */
namespace colors {
    /**
     * a string for reset all text edition in console (automaticaly add at the end of all log of `debug` and `json`)
     * 
     * ```ts
     * import { colors, debug } from "@gscript/gtools";
     * 
     * debug.log(reset + "Hello World");
     * ```
     */
    export const reset = "\x1b[0m";
    /**
     * a string for bright text in console
     * 
     * ```ts
     * import { colors, debug } from "@gscript/gtools";
     * 
     * debug.log(bright + "Hello World");
     * ```
     */
    export const bright = "\x1b[1m";
    /**
     * a string for dim text in console
     * 
     * ```ts
     * import { colors, debug } from "@gscript/gtools";
     * 
     * debug.log(dim + "Hello World");
     * ```
     */
    export const dim = "\x1b[2m";
    /**
     * a string for underscore text in console
     * 
     * ```ts
     * import { colors, debug } from "@gscript/gtools";
     * 
     * debug.log(underscore + "Hello World");
     * ```
     */
    export const underscore = "\x1b[4m";
    /**
     * a string for blink text in console
     * 
     * ```ts
     * import { colors, debug } from "@gscript/gtools";
     * 
     * debug.log(blink + "Hello World");
     * ```
     * 
     * (not work in all console)
     */
    export const blink = "\x1b[5m";
    /**
     * a string for reverse text colors in console
     * 
     * ```ts
     * import { colors, debug } from "@gscript/gtools";
     * 
     * debug.log(reverse + "Hello World");
     * ```
     */
    export const reverse = "\x1b[7m";
    /**
     * a string for hide text in console (but is already here)
     * 
     * ```ts
     * import { colors, debug } from "@gscript/gtools";
     * 
     * debug.log(hidden + "Hello World");
     * ```
     */
    export const hidden = "\x1b[8m";

    /**
     * a object with all foreground colors
     * 
     * - `black`
     * - `red`
     * - `green`
     * - `yellow`
     * - `blue`
     * - `magenta`
     * - `cyan`
     * - `white`
     * - `gray`
     */
    export enum fg {
        black = "\x1b[30m",
        red = "\x1b[31m",
        green = "\x1b[32m",
        yellow = "\x1b[33m",
        blue = "\x1b[34m",
        magenta = "\x1b[35m",
        cyan = "\x1b[36m",
        white = "\x1b[37m",
        gray = "\x1b[90m"
    };
    /**
     * a object with all background colors
     * 
     * - `black`
     * - `red`
     * - `green`
     * - `yellow`
     * - `blue`
     * - `magenta`
     * - `cyan`
     * - `white`
     * - `gray`
     */
    export enum bg {
        black = "\x1b[40m",
        red = "\x1b[41m",
        green = "\x1b[42m",
        yellow = "\x1b[43m",
        blue = "\x1b[44m",
        magenta = "\x1b[45m",
        cyan = "\x1b[46m",
        white = "\x1b[47m",
        gray = "\x1b[100m"
    };

    /**
     * the interface for a rgb color without alpha
     */
    export interface rgb {
        r: number;
        g: number;
        b: number;
    }
    /**
     * the interface for a rgb color with alpha
     */
    export interface rgba extends rgb {
        a: number;
    }
    /**
     * the interface for a hsv color without alpha
     */
    export interface hsv {
        h: number;
        s: number;
        v: number;
    }
    /**
     * the interface for a hsv color with alpha
     */
    export interface hsva extends hsv {
        a: number;
    }

    /**
     * the type for a color (contain all 4 classic format: `rgb`, `rgba`, `hsv`, `hsva`)
     */
    export type col = rgb | rgba | hsv | hsva;
    /**
     * transform rgb in hsv and hsv in rgb
     * already functionnal with alpha, and conserve the alpha if has an alpha
     */
    export type invertCol<T extends col> = (T extends hsva ? rgba : (T extends rgba ? hsva : (T extends hsv ? rgb : (T extends rgb ? hsv : never))));

    /**
     * a function for make a custom color in console
     * 
     * ```ts
     * import { colors, debug } from "@gscript/gtools";
     * 
     * debug.log(Perso({ fg: {
     *     r: 255,
     *     g: 0,
     *     b: 0
     * }, bg: {
     *     r: 0,
     *     g: 0,
     *     b: 255
     * }}) + "Hello World");
     * debug.log(Perso({ fg: {
     *     r: 255,
     *     g: 0,
     *     b: 0
     * }}) + "Hello World");
     * debug.log(Perso({ bg: {
     *     r: 0,
     *     g: 0,
     *     b: 255
     * }}) + "Hello World");
     * ```
     * 
     * @param option the option for the color, can contain `fg` and/or `bg`, but must contain at least one of them
     * @returns the string for the color
     */
    export function Perso(option: { fg?: col, bg: col } | { fg: col, bg?: col }): string {
        var { fg, bg } = option;
        var ret: string = "";
        if (fg) {
            if ("h" in fg) fg = rgbHsvTransform(fg);

            ret += `\u001b[38;2;${fg.r};${fg.g};${fg.b}m`;
        }
        if (bg) {
            if ("h" in bg) bg = rgbHsvTransform(bg);

            ret += `\u001b[48;2;${bg.r};${bg.g};${bg.b}m`;
        }
        return ret;
    }
    /**
     * transform a color in hsv to rgb and a color in rgb to hsv
     * 
     * ```ts
     * import { colors } from "@gscript/gtools";
     * 
     * const rgb = rgbHsvTransform({
     *     h: 0,
     *     s: 1,
     *     v: 1
     * });
     * console.log(rgb);
     * ```
     * 
     * @param col the color to transform
     * @returns the color transformed
     */
    export function rgbHsvTransform<T extends col>(col: T): Types.typeExt<col, invertCol<T>> {
        if ("r" in col) {
            const { r, g, b } = col as rgb;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            const v = max / 255;
            const s = max === 0 ? 0 : delta / max;
            let h = 0;
            if (max !== min) {
                if (max === r) {
                    h = (g - b) / delta + (g < b ? 6 : 0);
                } else if (max === g) {
                    h = (b - r) / delta + 2;
                } else {
                    h = (r - g) / delta + 4;
                }
                h *= 60;
            }
            return { h, s, v } as invertCol<T>;
        } else {
            const { h, s, v } = col as hsv;
            const c = v * s;
            const x = c * (1 - Math.abs((h / 60) % 2 - 1));
            const m = v - c;
            let r = 0;
            let g = 0;
            let b = 0;
            if (h < 60) {
                r = c;
                g = x;
            } else if (h < 120) {
                r = x;
                g = c;
            } else if (h < 180) {
                g = c;
                b = x;
            } else if (h < 240) {
                g = x;
                b = c;
            } else if (h < 300) {
                r = x;
                b = c;
            } else {
                r = c;
                b = x;
            }
            return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 } as invertCol<T>;
        }
    }
}

export default colors;