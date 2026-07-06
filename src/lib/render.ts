import type { Holiday, ModuleColor, Programme, VoleeData } from '../types';
import { MONTHS_FULL, WEEKDAYS_SHORT, mondayIndex, moduleWeekdayHint, orderedModules } from './calendar';
import { DEFAULT_FOOTERS, FOOTER_SUBLINE, moduleColor } from '../volees.config';

export const CAL_W = 1414;
export const CAL_H = 2000;

const INK = '#1d1d1f';
const GOLD = '#b3905a';
const BAND = '#efeadf';
const EMPTY = '#c7c1b6';
const HEADER = '#8d887e';
const HOLIDAY_BG = '#f8dada';
const HOLIDAY_X = '#ee382e';
const MUTED = '#6d6960';

const FONT = 'Poppins, sans-serif';

export interface RenderOptions {
	data: VoleeData;
	startYear: number;
	holidays: Holiday[];
	palettes: Record<Programme, Record<string, ModuleColor>>;
	footers?: Record<Programme, string>;
}

function esc(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function text(
	x: number,
	y: number,
	content: string,
	opts: { size: number; weight?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'; letter?: number } ,
): string {
	const { size, weight = 400, fill = INK, anchor = 'start', letter } = opts;
	return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${
		letter ? ` letter-spacing="${letter}"` : ''
	}>${esc(content)}</text>`;
}

function roundRect(
	x: number,
	y: number,
	w: number,
	h: number,
	r: number,
	opts: { fill?: string; stroke?: string; strokeW?: number; dash?: string } = {},
): string {
	const { fill = 'none', stroke, strokeW = 1, dash } = opts;
	return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}"${
		stroke ? ` stroke="${stroke}" stroke-width="${strokeW}"` : ''
	}${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

/** Build the complete SVG string for one volée calendar. */
export function renderCalendarSVG(o: RenderOptions): string {
	const { data, startYear, holidays, palettes } = o;
	const footers = o.footers ?? DEFAULT_FOOTERS;
	const prog = data.config.prog;
	const N = startYear;
	const parts: string[] = [];

	parts.push(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${CAL_W}" height="${CAL_H}" viewBox="0 0 ${CAL_W} ${CAL_H}">`,
	);
	parts.push(`<rect x="0" y="0" width="${CAL_W}" height="${CAL_H}" fill="#ffffff"/>`);

	// —— 1. Title & subtitle ——
	parts.push(text(84, 104, `${data.config.titre} · Calendrier complet ${N}–${N + 1}`, { size: 38, weight: 700, fill: INK }));
	parts.push(text(84, 138, data.config.sousTitre, { size: 22, weight: 500, fill: GOLD }));

	// —— 2. "jours au total" box (top-right) ——
	const boxW = 196;
	const boxH = 96;
	const boxX = CAL_W - 84 - boxW;
	const boxY = 60;
	parts.push(roundRect(boxX, boxY, boxW, boxH, 12, { stroke: GOLD, strokeW: 1.5, dash: '2 4' }));
	parts.push(text(boxX + boxW / 2, boxY + 52, String(data.total), { size: 46, weight: 700, fill: INK, anchor: 'middle' }));
	parts.push(text(boxX + boxW / 2, boxY + 76, 'jours au total', { size: 15, weight: 400, fill: MUTED, anchor: 'middle' }));

	// —— 3. Module summary boxes ——
	const modules = orderedModules(data);
	const sumY = 178;
	const sumH = 104;
	const sumW = 176;
	const gap = 16;
	modules.forEach((mod, idx) => {
		const x = 84 + idx * (sumW + gap);
		const col = moduleColor(palettes, prog, mod);
		parts.push(roundRect(x, sumY, sumW, sumH, 12, { stroke: GOLD, strokeW: 1.5, dash: '2 4' }));
		parts.push(text(x + 18, sumY + 48, String(data.moduleCounts[mod] ?? 0), { size: 36, weight: 700, fill: col.dark }));
		parts.push(text(x + 18, sumY + 70, `Cours ${mod}`, { size: 15, weight: 500, fill: INK }));
		const hint = moduleWeekdayHint(data.days, mod);
		if (hint) parts.push(text(x + 18, sumY + 90, hint, { size: 13, weight: 500, fill: MUTED }));
	});

	// —— 4. Month grid (4 cols × 3 rows), Aug N → Jul N+1 ——
	const gridX = 84;
	const gridY = 320;
	const gridW = CAL_W - 2 * 84;
	const gridBottom = 1872;
	const gridH = gridBottom - gridY;
	const colGap = 24;
	const rowGap = 22;
	const cols = 4;
	const rows = 3;
	const cellW = (gridW - (cols - 1) * colGap) / cols;
	const cellH = (gridH - (rows - 1) * rowGap) / rows;

	const dayMap = new Map(data.days.map((d) => [d.iso, d] as const));
	const holidaySet = new Set(holidays.map((h) => h.date));

	for (let i = 0; i < 12; i++) {
		const monthIndex = (7 + i) % 12; // Aug = 7
		const year = 7 + i < 12 ? N : N + 1;
		const cx = gridX + (i % cols) * (cellW + colGap);
		const cy = gridY + Math.floor(i / cols) * (cellH + rowGap);
		parts.push(renderMonth(monthIndex, year, cx, cy, cellW, cellH, data, prog, palettes, dayMap, holidaySet));
	}

	// —— 5. Legend ——
	const legY = 1904;
	parts.push(roundRect(84, legY - 13, 18, 18, 3, { fill: '#fff', stroke: INK, strokeW: 1.4, dash: '3 2' }));
	parts.push(text(112, legY + 1, "examens d'évaluation", { size: 15, weight: 400, fill: MUTED }));
	if (data.hasEvening) {
		const ex = 372;
		parts.push(`<circle cx="${ex + 9}" cy="${legY - 4}" r="4.2" fill="${INK}"/>`);
		parts.push(text(ex + 22, legY + 1, '18h–22h en ligne', { size: 15, weight: 400, fill: MUTED }));
	}

	// —— 6. Footer ——
	const footY = 1958;
	parts.push(text(84, footY, footers[prog], { size: 16, weight: 600, fill: INK, letter: 0.5 }));
	parts.push(text(84, footY + 22, FOOTER_SUBLINE, { size: 10.5, weight: 400, fill: HEADER, letter: 0.5 }));

	// cAH logo text (right), preceded by a grey vertical bar
	const logoRightX = CAL_W - 84;
	const logoText = 'cAH';
	// draw "AH" then "c" to control colours; use two <text> segments right-aligned.
	parts.push(
		`<text x="${logoRightX}" y="${footY + 6}" font-family="${FONT}" font-size="30" font-weight="700" text-anchor="end">` +
			`<tspan fill="${GOLD}">c</tspan><tspan fill="${INK}">AH</tspan></text>`,
	);
	parts.push(`<rect x="${logoRightX - 92}" y="${footY - 20}" width="1.5" height="34" fill="${HEADER}"/>`);

	parts.push('</svg>');
	return parts.join('');
}

function renderMonth(
	monthIndex: number,
	year: number,
	x: number,
	y: number,
	w: number,
	h: number,
	data: VoleeData,
	prog: Programme,
	palettes: Record<Programme, Record<string, ModuleColor>>,
	dayMap: Map<string, { module: string; isExam: boolean; evening: boolean }>,
	holidaySet: Set<string>,
): string {
	const p: string[] = [];

	// Month band
	const bandH = 40;
	p.push(roundRect(x, y, w, bandH, 10, { fill: BAND }));
	p.push(text(x + w / 2, y + 27, `${MONTHS_FULL[monthIndex]} ${year}`, { size: 21, weight: 600, fill: INK, anchor: 'middle' }));

	// Colored month count subline: M2x9  M1x3  MPx2
	const modOrder = orderedModules(data);
	const monthCounts = new Map<string, number>();
	for (const d of data.days) {
		if (d.date.getMonth() === monthIndex && d.date.getFullYear() === year) {
			monthCounts.set(d.module, (monthCounts.get(d.module) ?? 0) + 1);
		}
	}
	const segs = modOrder.filter((m) => monthCounts.get(m)).map((m) => ({ m, c: monthCounts.get(m)! }));
	const sublineY = y + bandH + 20;
	if (segs.length) {
		// Center the whole subline: measure with approximate width per segment.
		const labels = segs.map((s) => `${s.m}x${s.c}`);
		const approxW = labels.reduce((acc, l) => acc + l.length * 8.2, 0) + (segs.length - 1) * 12;
		let curX = x + w / 2 - approxW / 2;
		segs.forEach((s, idx) => {
			const col = moduleColor(palettes, prog, s.m);
			const label = labels[idx];
			p.push(text(curX, sublineY, label, { size: 13.5, weight: 500, fill: col.dark }));
			curX += label.length * 8.2 + 12;
		});
	}

	// Weekday headers L M M J V S D
	const headers = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
	const gridTop = y + bandH + 34;
	const colW = w / 7;
	headers.forEach((hd, idx) => {
		p.push(text(x + colW * idx + colW / 2, gridTop, hd, { size: 14, weight: 500, fill: HEADER, anchor: 'middle' }));
	});

	// Day cells (6 rows)
	const firstDay = new Date(year, monthIndex, 1, 12);
	const startCol = mondayIndex(firstDay);
	const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
	const rowsCount = 6;
	const cellsTop = gridTop + 12;
	const cellsH = y + h - cellsTop - 4;
	const rowH = cellsH / rowsCount;
	const pillW = Math.min(colW - 8, 34);
	const pillH = Math.min(rowH - 8, 30);

	for (let d = 1; d <= daysInMonth; d++) {
		const slot = startCol + d - 1;
		const r = Math.floor(slot / 7);
		const c = slot % 7;
		const slotCX = x + colW * c + colW / 2;
		const slotCY = cellsTop + rowH * r + rowH / 2;
		const iso = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
		const course = dayMap.get(iso);
		const isHoliday = holidaySet.has(iso);
		const pillX = slotCX - pillW / 2;
		const pillY = slotCY - pillH / 2;
		const numBaseline = slotCY + 5.5;

		if (isHoliday) {
			p.push(roundRect(pillX, pillY, pillW, pillH, 6, { fill: HOLIDAY_BG }));
			p.push(text(slotCX, numBaseline, 'X', { size: 15, weight: 700, fill: HOLIDAY_X, anchor: 'middle' }));
		} else if (course) {
			const col = moduleColor(palettes, prog, course.module);
			p.push(roundRect(pillX, pillY, pillW, pillH, 6, { fill: col.light }));
			if (course.isExam) {
				p.push(roundRect(pillX, pillY, pillW, pillH, 6, { stroke: INK, strokeW: 1.3, dash: '3 2' }));
			}
			p.push(text(slotCX, numBaseline, String(d), { size: 15.5, weight: 600, fill: col.dark, anchor: 'middle' }));
			if (course.evening) {
				// small dot marking an evening / online session (e.g. 18h–22h en ligne)
				p.push(`<circle cx="${pillX + pillW - 5.5}" cy="${pillY + pillH - 5.5}" r="2.6" fill="${col.dark}"/>`);
			}
		} else {
			p.push(text(slotCX, numBaseline, String(d), { size: 15.5, weight: 400, fill: EMPTY, anchor: 'middle' }));
		}
	}

	return p.join('');
}
