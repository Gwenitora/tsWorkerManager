namespace Types {
    /**
 * To make shure your type extends a parent type, else, return never
 */
    export type typeExt<parent, child> = child extends parent ? child : never;


    type allPermutation<T, U = T> = [T] extends [never]
        ? []
        : T extends any
        ? [T, ...allPermutation<Exclude<U, T>>]
        : never;
    /**
     * To create a type that is a combination of all the elements of a tuple in all order
     */
    export type allPermutations<T> = [T] extends [never] ? [] : allPermutation<T>;

    type contentCombination<T extends any> =
        T extends [infer Head, ...infer Tail] ? (
            Tail extends any[] ? (
                | []
                | [Head]
                | contentCombination<Tail>
                | [Head, ...contentCombination<Tail>]
                | [...contentCombination<Tail>, Head]
            ) : never
        ) : never
    /**
     * To create a type that is a combination of all the elements of a tuple in all order but in max one apparition of each elements
     */
    export type contentCombinations<T extends any> = contentCombination<allPermutations<T>>;
    /**
     * To create a list of a specific length and a specific type, if the length is 0, return the empty array
     */
    export type ListOfSpecificLenght<T, Length extends number, R extends unknown[] = []> = R['length'] extends Length ? R : ListOfSpecificLenght<T, Length, [T, ...R]>;
    /**
     * To create a list of a specific length and a specific type, if the length is 0, return the array with any length
     */
    export type ListOfLenght<T, Length extends number> = Length extends 0 ? T[] : ListOfSpecificLenght<T, Length>;

    /**
     * To get the first parameter of a function
     */
    export type FirstParam<T> = T extends (arg: infer P, ...args: any[]) => any ? P : never;
    /**
     * To get the return parameter of a function
     */
    export type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
    /**
     * Get the content of a list as a type
     */
    export type ContentOfList<T> = T extends (infer U)[] ? U :
        T extends readonly (infer U)[] ? U :
        T extends [infer U, ...infer Rest] ? U | ContentOfList<Rest> : never;
    /**
     * Add 1 to a number but in type
     */
    export type Increment<T extends number> = [...ListOfSpecificLenght<unknown, T>, unknown]['length'];
    /**
     * Substract 1 to a number but in type
     */
    export type Decrement<T extends number> = ListOfSpecificLenght<unknown, T> extends [unknown, ...(infer U)] ? U['length'] : 0;

    /**
     * Augment the numbers of list after the value
     */
    export type listExtendDistance<T, U extends number = 0> =
        U extends 0
        ? T
        : (
            T[] extends infer R
            ? listExtendDistance<R, Decrement<U>>
            : never
        )
}

export default Types;