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
	return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&headers=0&sheet=${encodeURIComponent(
		onglet,
	)}`;
}

/** gviz JSON endpoint, read via a <script> tag (JSONP) to bypass CORS — still direct to Google. */
function gvizJsonpUrl(sheetId: string, onglet: string, callback: string): string {
	return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json;responseHandler:${callback}&headers=0&sheet=${encodeURIComponent(
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

/** Try the direct CSV fetch. Returns the matrix, or null if it fails (CORS / not public). */
async function tryFetchCsv(sheetId: string, onglet: string): Promise<string[][] | null> {
	try {
		const resp = await fetch(gvizUrl(sheetId, onglet), { redirect: 'follow' });
		if (!resp.ok) return null;
		const text = await resp.text();
		if (/^\s*</.test(text) || text.includes('<!DOCTYPE') || text.includes('gviz error')) return null;
		return parseCsv(text);
	} catch {
		return null;
	}
}

let jsonpSeq = 0;

interface GvizCell {
	v: unknown;
	f?: string;
}
interface GvizTable {
	status?: string;
	table?: { cols?: unknown[]; rows?: { c: (GvizCell | null)[] }[] };
}

function cellToString(c: GvizCell | null): string {
	if (!c) return '';
	if (c.f != null) return String(c.f);
	if (c.v != null) return String(c.v);
	return '';
}

/**
 * Load a tab via the gviz JSON endpoint using a <script> tag (JSONP), which bypasses CORS.
 * Browser-only. Rejects if the sheet is not public or the tab is missing.
 */
function fetchSheetTabJsonp(sheetId: string, onglet: string): Promise<string[][]> {
	return new Promise((resolve, reject) => {
		if (typeof document === 'undefined') {
			reject(new SheetError());
			return;
		}
		const cb = `__cah_gviz_${Date.now()}_${jsonpSeq++}`;
		const script = document.createElement('script');
		let done = false;
		const cleanup = () => {
			delete (window as unknown as Record<string, unknown>)[cb];
			script.remove();
			clearTimeout(timer);
		};
		const timer = setTimeout(() => {
			if (done) return;
			done = true;
			cleanup();
			reject(new SheetError());
		}, 15000);

		(window as unknown as Record<string, unknown>)[cb] = (data: GvizTable) => {
			if (done) return;
			done = true;
			cleanup();
			if (!data || data.status === 'error' || !data.table?.rows) {
				reject(new SheetError());
				return;
			}
			const colCount = data.table.cols?.length ?? 0;
			const matrix = data.table.rows.map((r) => {
				const cells = r.c ?? [];
				const n = Math.max(colCount, cells.length);
				const out: string[] = [];
				for (let i = 0; i < n; i++) out.push(cellToString(cells[i] ?? null));
				return out;
			});
			resolve(matrix);
		};

		script.onerror = () => {
			if (done) return;
			done = true;
			cleanup();
			reject(new SheetError());
		};
		script.src = gvizJsonpUrl(sheetId, onglet, cb);
		document.head.appendChild(script);
	});
}

/**
 * Fetch a single tab as a matrix from the public sheet. Tries the direct CSV endpoint first,
 * then falls back to the JSONP (JSON) endpoint which bypasses CORS. Throws SheetError on failure.
 */
export async function fetchSheetTab(sheetId: string, onglet: string): Promise<string[][]> {
	const csv = await tryFetchCsv(sheetId, onglet);
	if (csv) return csv;
	// CSV fetch failed (usually CORS in the browser) — retry via the CORS-free JSONP endpoint.
	if (typeof document !== 'undefined') {
		return fetchSheetTabJsonp(sheetId, onglet);
	}
	throw new SheetError();
}
