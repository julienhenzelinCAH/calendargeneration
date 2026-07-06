import Papa from 'papaparse';

/** Extract a Google Sheets spreadsheet ID from a full URL or return the input unchanged. */
export function sheetIdFromInput(input: string): string {
	const trimmed = input.trim();
	const m = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
	if (m) return m[1];
	// Bare "d/{id}" or "id=..." fallbacks
	const m2 = trimmed.match(/[?&]id=([a-zA-Z0-9-_]+)/);
	if (m2) return m2[1];
	return trimmed;
}

/** Build the public gviz CSV endpoint for a given sheet tab (read by name). */
export function gvizUrl(sheetId: string, onglet: string): string {
	return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
		onglet,
	)}`;
}

export class SheetError extends Error {
	constructor() {
		super(
			'Classeur non public ou onglet introuvable — vérifie le partage « Tout utilisateur disposant du lien : Lecteur » et l’orthographe exacte de l’onglet.',
		);
		this.name = 'SheetError';
	}
}

/**
 * Parse a date string in local timezone. Accepts dd.mm.yyyy, dd/mm/yyyy and yyyy-mm-dd.
 * NEVER uses `new Date(string)` (which would parse in UTC and shift days).
 */
export function parseDateLocal(raw: string): Date | null {
	if (!raw) return null;
	const s = raw.trim();
	if (!s) return null;

	// yyyy-mm-dd (or yyyy/mm/dd)
	let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
	if (m) {
		const [, y, mo, d] = m;
		return makeLocal(+y, +mo, +d);
	}
	// dd.mm.yyyy or dd/mm/yyyy or dd-mm-yyyy
	m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
	if (m) {
		const [, d, mo, y] = m;
		const year = y.length === 2 ? 2000 + +y : +y;
		return makeLocal(year, +mo, +d);
	}
	// Google "Date(y,m,d)" serialisation that sometimes slips through gviz
	m = s.match(/^Date\((\d+),(\d+),(\d+)/);
	if (m) {
		const [, y, mo, d] = m;
		return makeLocal(+y, +mo + 1, +d); // gviz month is 0-based here
	}
	return null;
}

function makeLocal(y: number, month1: number, day: number): Date | null {
	if (month1 < 1 || month1 > 12 || day < 1 || day > 31) return null;
	const d = new Date(y, month1 - 1, day, 12, 0, 0, 0); // noon local, DST-safe
	if (d.getFullYear() !== y || d.getMonth() !== month1 - 1 || d.getDate() !== day) return null;
	return d;
}

/** Parse a CSV blob into a matrix of trimmed string cells. */
export function parseCsv(text: string): string[][] {
	const res = Papa.parse<string[]>(text, { skipEmptyLines: false });
	return (res.data || []).map((row) => (Array.isArray(row) ? row.map((c) => (c ?? '').toString()) : []));
}

/** Fetch a single tab as a CSV matrix from the public sheet. Throws SheetError on failure. */
export async function fetchSheetTab(sheetId: string, onglet: string): Promise<string[][]> {
	let text: string;
	try {
		const resp = await fetch(gvizUrl(sheetId, onglet), { redirect: 'follow' });
		if (!resp.ok) throw new SheetError();
		text = await resp.text();
	} catch {
		throw new SheetError();
	}
	// gviz returns an HTML error page (not CSV) when the tab/sheet is not accessible.
	if (/^\s*</.test(text) || text.includes('<!DOCTYPE') || text.includes('gviz error')) {
		throw new SheetError();
	}
	return parseCsv(text);
}
