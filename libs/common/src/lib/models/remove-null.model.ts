export type ExpandRecursively<T> = T extends object ? (T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never) : T;

export type RemoveNull<T> = ExpandRecursively<{ [K in keyof T]: Exclude<RemoveNull<T[K]>, null> }>;
