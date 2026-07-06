export function lsGet<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		if (raw == null) return fallback;
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

export function lsSet<T>(key: string, value: T): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		/* ignore quota errors */
	}
}

export function uid(prefix = 'id'): string {
	return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
