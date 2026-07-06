import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import { CAL_W, CAL_H, renderCalendarSVG, type RenderOptions } from './render';

/** Poppins weights we embed for vectorial PDF text. Sourced from the Google Fonts mirror on jsDelivr. */
const POPPINS_FILES: { weight: number; file: string }[] = [
	{ weight: 400, file: 'Poppins-Regular.ttf' },
	{ weight: 500, file: 'Poppins-Medium.ttf' },
	{ weight: 600, file: 'Poppins-SemiBold.ttf' },
	{ weight: 700, file: 'Poppins-Bold.ttf' },
];
const POPPINS_BASE = 'https://cdn.jsdelivr.net/gh/google/fonts/ofl/poppins/';

let fontCache: { weight: number; b64: string }[] | null = null;
let fontLoadFailed = false;

function abToBase64(buf: ArrayBuffer): string {
	let binary = '';
	const bytes = new Uint8Array(buf);
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
	}
	return btoa(binary);
}

async function loadPoppins(): Promise<{ weight: number; b64: string }[] | null> {
	if (fontCache) return fontCache;
	if (fontLoadFailed) return null;
	try {
		const loaded = await Promise.all(
			POPPINS_FILES.map(async ({ weight, file }) => {
				const resp = await fetch(POPPINS_BASE + file);
				if (!resp.ok) throw new Error(`font ${file}`);
				const buf = await resp.arrayBuffer();
				return { weight, b64: abToBase64(buf) };
			}),
		);
		fontCache = loaded;
		return loaded;
	} catch {
		fontLoadFailed = true;
		return null;
	}
}

function registerFonts(doc: jsPDF, fonts: { weight: number; b64: string }[]) {
	for (const { weight, b64 } of fonts) {
		const vfsName = `Poppins-${weight}.ttf`;
		doc.addFileToVFS(vfsName, b64);
		doc.addFont(vfsName, 'Poppins', 'normal', weight);
	}
}

/** Build an offscreen DOM SVG element from an SVG string. */
function svgElementFromString(svg: string): SVGSVGElement {
	const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
	return doc.documentElement as unknown as SVGSVGElement;
}

async function addPageFromSVG(doc: jsPDF, svg: string, firstPage: boolean) {
	if (!firstPage) doc.addPage([CAL_W, CAL_H], 'portrait');
	const el = svgElementFromString(svg);
	// svg2pdf measures text via the live DOM — attach offscreen while rendering.
	const holder = document.createElement('div');
	holder.style.cssText = 'position:fixed;left:-99999px;top:0;opacity:0;pointer-events:none';
	holder.appendChild(el);
	document.body.appendChild(holder);
	try {
		await svg2pdf(el, doc, { x: 0, y: 0, width: CAL_W, height: CAL_H });
	} finally {
		document.body.removeChild(holder);
	}
}

function newDoc(): jsPDF {
	return new jsPDF({ orientation: 'portrait', unit: 'pt', format: [CAL_W, CAL_H], compress: true });
}

/** Export a single volée as a vectorial PDF. */
export async function exportVoleePDF(opts: RenderOptions): Promise<void> {
	const fonts = await loadPoppins();
	const doc = newDoc();
	if (fonts) registerFonts(doc, fonts);
	const svg = renderCalendarSVG(opts);
	await addPageFromSVG(doc, svg, true);
	const N = opts.startYear;
	doc.save(`Calendrier_${sanitize(opts.data.config.titre)}_${N}-${N + 1}.pdf`);
}

/** Export several volées, one page each, in configuration order. */
export async function exportGroupPDF(list: RenderOptions[], startYear: number): Promise<void> {
	if (list.length === 0) return;
	const fonts = await loadPoppins();
	const doc = newDoc();
	if (fonts) registerFonts(doc, fonts);
	for (let i = 0; i < list.length; i++) {
		const svg = renderCalendarSVG(list[i]);
		await addPageFromSVG(doc, svg, i === 0);
	}
	doc.save(`Calendriers_cAH_${startYear}-${startYear + 1}.pdf`);
}

/** True once fonts have been attempted and failed (so the UI can warn about fallback rendering). */
export function poppinsFallbackActive(): boolean {
	return fontLoadFailed;
}

function sanitize(s: string): string {
	return s.replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '');
}
