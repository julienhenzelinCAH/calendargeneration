/**
 * Custom-font store: lets the user upload their own brand fonts (Euclid Flex, Suisse Intl)
 * and the calendar font (Poppins). Uploaded fonts are persisted in localStorage as base64 and
 * injected at runtime via the CSS Font Loading API, so they apply to the app chrome, the SVG
 * preview and (for Poppins) the vectorial PDF export.
 */

export interface FontSlot {
	key: string;
	family: string;
	weight: number;
	style: 'normal' | 'italic';
	label: string;
	group: 'Euclid Flex' | 'Suisse Intl' | 'Poppins (calendrier)';
	forPdf?: boolean;
}

export const FONT_SLOTS: FontSlot[] = [
	{ key: 'euclid-400', family: 'Euclid Flex', weight: 400, style: 'normal', label: 'Regular', group: 'Euclid Flex' },
	{ key: 'euclid-500', family: 'Euclid Flex Medium', weight: 500, style: 'normal', label: 'Medium', group: 'Euclid Flex' },
	{ key: 'euclid-700', family: 'Euclid Flex', weight: 700, style: 'normal', label: 'Bold', group: 'Euclid Flex' },
	{ key: 'suisse-400', family: 'Suisse intl', weight: 400, style: 'normal', label: 'Regular', group: 'Suisse Intl' },
	{ key: 'suisse-700', family: 'Suisse intl', weight: 700, style: 'normal', label: 'Bold', group: 'Suisse Intl' },
	{ key: 'suisse-book', family: 'Suisse intl Book', weight: 400, style: 'normal', label: 'Book', group: 'Suisse Intl' },
	{ key: 'suisse-medium', family: 'Suisse intl Medium', weight: 400, style: 'normal', label: 'Medium', group: 'Suisse Intl' },
	{ key: 'poppins-400', family: 'Poppins', weight: 400, style: 'normal', label: 'Regular', group: 'Poppins (calendrier)', forPdf: true },
	{ key: 'poppins-500', family: 'Poppins', weight: 500, style: 'normal', label: 'Medium', group: 'Poppins (calendrier)', forPdf: true },
	{ key: 'poppins-600', family: 'Poppins', weight: 600, style: 'normal', label: 'SemiBold', group: 'Poppins (calendrier)', forPdf: true },
	{ key: 'poppins-700', family: 'Poppins', weight: 700, style: 'normal', label: 'Bold', group: 'Poppins (calendrier)', forPdf: true },
];

const LS_KEY = 'cah_custom_fonts';
const slotByKey = new Map(FONT_SLOTS.map((s) => [s.key, s]));
const injected = new Map<string, FontFace>();

function readStore(): Record<string, string> {
	try {
		return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
	} catch {
		return {};
	}
}
function writeStore(map: Record<string, string>): boolean {
	try {
		localStorage.setItem(LS_KEY, JSON.stringify(map));
		return true;
	} catch {
		return false; // quota exceeded — fonts stay for the session only
	}
}

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return bytes.buffer;
}

export function arrayBufferToBase64(buf: ArrayBuffer): string {
	let binary = '';
	const bytes = new Uint8Array(buf);
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
	}
	return btoa(binary);
}

function inject(slot: FontSlot, b64: string) {
	if (typeof document === 'undefined' || typeof FontFace === 'undefined') return;
	const prev = injected.get(slot.key);
	if (prev) {
		try {
			document.fonts.delete(prev);
		} catch {
			/* ignore */
		}
	}
	const face = new FontFace(slot.family, base64ToArrayBuffer(b64), {
		weight: String(slot.weight),
		style: slot.style,
	});
	face
		.load()
		.then((f) => document.fonts.add(f))
		.catch(() => {
			/* invalid font file */
		});
	injected.set(slot.key, face);
}

/** Inject every persisted custom font. Call once at startup, before render. */
export function initCustomFonts(): void {
	const store = readStore();
	for (const [key, b64] of Object.entries(store)) {
		const slot = slotByKey.get(key);
		if (slot && b64) inject(slot, b64);
	}
}

/** Store + inject an uploaded font for a slot. Returns false if it couldn't be persisted. */
export function setCustomFont(key: string, b64: string): boolean {
	const slot = slotByKey.get(key);
	if (!slot) return false;
	inject(slot, b64);
	const store = readStore();
	store[key] = b64;
	return writeStore(store);
}

/** Remove a custom font for a slot (falls back to the bundled / default font). */
export function removeCustomFont(key: string): void {
	const face = injected.get(key);
	if (face && typeof document !== 'undefined') {
		try {
			document.fonts.delete(face);
		} catch {
			/* ignore */
		}
		injected.delete(key);
	}
	const store = readStore();
	delete store[key];
	writeStore(store);
}

/** Keys of slots that currently have a custom font uploaded. */
export function loadedFontKeys(): Set<string> {
	return new Set(Object.keys(readStore()));
}

/** Uploaded Poppins per weight (for the PDF export), if present. */
export function uploadedPoppins(): { weight: number; b64: string }[] {
	const store = readStore();
	const out: { weight: number; b64: string }[] = [];
	for (const slot of FONT_SLOTS) {
		if (slot.forPdf && store[slot.key]) out.push({ weight: slot.weight, b64: store[slot.key] });
	}
	return out;
}
