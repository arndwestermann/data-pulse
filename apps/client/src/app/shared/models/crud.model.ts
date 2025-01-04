export type TCrud<T, K = 'create' | 'read' | 'update' | 'delete' | 'deleteAll'> = T extends (infer U)[]
	? K extends 'read'
		? { value: U[]; type: K }
		: { value: T; type: K }
	: { value: T; type: K };
