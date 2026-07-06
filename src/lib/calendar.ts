import type {
	CourseDay,
	Displaced,
	Holiday,
	Programme,
	Session,
	Shifted,
	VoleeConfig,
	VoleeData,
} from '../types';
import { MODULE_PRIORITY } from '../volees.config';
import { parseDateLocal } from './csv';

// ——————————————————————————————————————————————————————————————
// Date helpers (always local time)
// ——————————————————————————————————————————————————————————————

export const WEEKDAYS_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
export const WEEKDAYS_SHORT = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
export const WEEKDAYS_PLURAL = ['dimanches', 'lundis', 'mardis', 'mercredis', 'jeudis', 'vendredis', 'samedis'];
export const MONTHS_FULL = [
	'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
	'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export function iso(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
	const r = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
	r.setDate(r.getDate() + n);
	return r;
}

/** Monday-based weekday index: Monday=0 … Sunday=6. */
export function mondayIndex(d: Date): number {
	return (d.getDay() + 6) % 7;
}

// ——————————————————————————————————————————————————————————————
// Computus & Vaud holidays
// ——————————————————————————————————————————————————————————————

/** Gregorian Easter Sunday (Anonymous / Meeus algorithm). */
export function easterSunday(year: number): Date {
	const a = year % 19;
	const b = Math.floor(year / 100);
	const c = year % 100;
	const d = Math.floor(b / 4);
	const e = b % 4;
	const f = Math.floor((b + 8) / 25);
	const g = Math.floor((b - f + 1) / 3);
	const h = (19 * a + b - d - g + 15) % 30;
	const i = Math.floor(c / 4);
	const k = c % 4;
	const l = (32 + 2 * e + 2 * i - h - k) % 7;
	const m = Math.floor((a + 11 * h + 22 * l) / 451);
	const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
	const day = ((h + l - 7 * m + 114) % 31) + 1;
	return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/** Monday of the Jeûne fédéral = Monday following the 3rd Sunday of September. */
export function jeuneFederal(year: number): Date {
	// Find first Sunday of September, then +2 weeks = 3rd Sunday, then +1 day = Monday.
	const sep1 = new Date(year, 8, 1, 12, 0, 0, 0);
	const firstSundayOffset = (7 - sep1.getDay()) % 7;
	const thirdSunday = addDays(sep1, firstSundayOffset + 14);
	return addDays(thirdSunday, 1);
}

/** Vaud public holidays covering the school year (Aug year N → Jul year N+1). */
export function vaudHolidays(startYear: number): Holiday[] {
	const list: { date: Date; label: string }[] = [];
	// Easter-derived: the school year Aug N → Jul N+1 contains spring of year N+1.
	const easter = easterSunday(startYear + 1);
	list.push({ date: addDays(easter, -2), label: 'Vendredi Saint' });
	list.push({ date: addDays(easter, 1), label: 'Lundi de Pâques' });
	list.push({ date: addDays(easter, 39), label: 'Ascension' });
	list.push({ date: addDays(easter, 50), label: 'Lundi de Pentecôte' });
	// Jeûne fédéral (September of year N)
	list.push({ date: jeuneFederal(startYear), label: 'Lundi du Jeûne fédéral' });
	// Fixed dates
	list.push({ date: new Date(startYear, 11, 25, 12), label: 'Noël' });
	list.push({ date: new Date(startYear + 1, 0, 1, 12), label: 'Nouvel An' });

	return list
		.sort((a, b) => a.date.getTime() - b.date.getTime())
		.map((h, idx) => ({ id: `vaud-${startYear}-${idx}`, date: iso(h.date), label: h.label }));
}

// ——————————————————————————————————————————————————————————————
// Session parsing & classification
// ——————————————————————————————————————————————————————————————

const EXAM_RE = /examen|évalu|evalu|certif|partiel/i;
const EXEMPT_RE = /complémentaire|complementaire/i;

/** True if a description denotes an exam (but not "Examens complémentaires"). */
export function isExam(description: string): boolean {
	if (!description) return false;
	if (EXEMPT_RE.test(description)) return false;
	return EXAM_RE.test(description);
}

const ONLINE_RE = /en\s?ligne|online|visio|distanciel|zoom|teams|webinaire|soir/i;

/**
 * True if the horaire denotes an evening / online session (e.g. "18h00-22h00 en ligne").
 * Detected from an online keyword or a start time at or after 17h.
 */
export function isEveningHoraire(horaire: string): boolean {
	if (!horaire) return false;
	if (ONLINE_RE.test(horaire)) return true;
	const m = horaire.match(/(\d{1,2})\s*[h:.]/);
	if (m) {
		const hr = Number(m[1]);
		if (hr >= 17 && hr <= 23) return true;
	}
	return false;
}

/**
 * Parse the raw matrix of a volée tab into sessions.
 * Columns (0-based): B=1 date, C=2 weekday, D=3 horaires, F=5 module, G=6 description.
 * Data starts at row 2 (index 1).
 */
export function parseSessions(rows: string[][], projectionOffset = 0): Session[] {
	const out: Session[] = [];
	for (let i = 1; i < rows.length; i++) {
		const row = rows[i];
		if (!row) continue;
		const dateRaw = (row[1] ?? '').trim();
		let date = parseDateLocal(dateRaw);
		if (!date) continue;
		const moduleRaw = (row[5] ?? '').trim().toUpperCase();
		if (!moduleRaw) continue;
		if (projectionOffset) date = addDays(date, projectionOffset);
		const description = (row[6] ?? '').trim();
		const horaire = (row[3] ?? '').trim();
		out.push({
			date,
			module: moduleRaw,
			description,
			horaire,
			isExam: isExam(description),
			evening: isEveningHoraire(horaire),
		});
	}
	return out;
}

/** Choose the dominant module of a day: most sessions, ties broken by programme priority. */
export function dominantModule(modules: string[], prog: Programme): string {
	const counts = new Map<string, number>();
	for (const m of modules) counts.set(m, (counts.get(m) ?? 0) + 1);
	const priority = MODULE_PRIORITY[prog] ?? [];
	let best = modules[0];
	let bestCount = -1;
	for (const [mod, cnt] of counts) {
		if (cnt > bestCount) {
			best = mod;
			bestCount = cnt;
		} else if (cnt === bestCount) {
			const pi = priority.indexOf(mod);
			const pj = priority.indexOf(best);
			const ri = pi === -1 ? Number.MAX_SAFE_INTEGER : pi;
			const rj = pj === -1 ? Number.MAX_SAFE_INTEGER : pj;
			if (ri < rj) best = mod;
		}
	}
	return best;
}

/** Aggregate sessions into course days for a given programme. */
export function aggregateDays(sessions: Session[], config: VoleeConfig): CourseDay[] {
	const byDay = new Map<string, Session[]>();
	for (const s of sessions) {
		const key = iso(s.date);
		const arr = byDay.get(key);
		if (arr) arr.push(s);
		else byDay.set(key, [s]);
	}
	const knownModules = new Set(Object.keys(MODULE_PRIORITY[config.prog] ?? {}).length
		? MODULE_PRIORITY[config.prog]
		: []);
	const days: CourseDay[] = [];
	for (const [key, arr] of byDay) {
		const module = dominantModule(arr.map((s) => s.module), config.prog);
		const eveningCount = arr.filter((s) => s.evening).length;
		days.push({
			date: arr[0].date,
			iso: key,
			module,
			isExam: arr.some((s) => s.isExam),
			evening: eveningCount * 2 >= arr.length, // majority of the day's sessions are evening/online
			sessionCount: arr.length,
			unknownModule: !knownModules.has(module),
		});
	}
	days.sort((a, b) => a.date.getTime() - b.date.getTime());
	return days;
}

/**
 * Find a nearby free date (not a holiday, not already occupied, a weekday) to shift a course
 * off a holiday, preserving the total day count. Tries −1, +1, −2, +2… up to ±7 days.
 */
function findFreeDay(date: Date, holidaySet: Set<string>, occupied: Set<string>): Date | null {
	const offsets = [-1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7];
	for (const off of offsets) {
		const cand = addDays(date, off);
		const wd = cand.getDay();
		if (wd === 0 || wd === 6) continue; // keep it on a weekday
		const ci = iso(cand);
		if (holidaySet.has(ci) || occupied.has(ci)) continue;
		return cand;
	}
	return null;
}

/**
 * Build full VoleeData: aggregate, remove holiday collisions (moving them to `displaced`),
 * and count modules over the kept days.
 */
export function buildVoleeData(
	rows: string[][],
	config: VoleeConfig,
	holidays: Holiday[],
	projectionOffset = 0,
): VoleeData {
	const projecting = projectionOffset !== 0;
	const sessions = parseSessions(rows, projectionOffset);
	const allDays = aggregateDays(sessions, config);
	const holidaySet = new Set(holidays.map((h) => h.date));

	// First pass: keep the days that don't collide with a holiday.
	const days: CourseDay[] = [];
	const collisions: CourseDay[] = [];
	const occupied = new Set<string>();
	for (const d of allDays) {
		if (holidaySet.has(d.iso)) {
			collisions.push(d);
		} else {
			days.push(d);
			occupied.add(d.iso);
		}
	}

	// Second pass: resolve collisions. In projection mode we preserve the day count by shifting
	// the course to a nearby free date (typically Easter-driven holidays that move year to year);
	// otherwise the day is dropped and reported under "cours à reporter".
	const displaced: Displaced[] = [];
	const shifted: Shifted[] = [];
	for (const d of collisions) {
		const target = projecting ? findFreeDay(d.date, holidaySet, occupied) : null;
		if (target) {
			const ti = iso(target);
			occupied.add(ti);
			const moved: CourseDay = { ...d, date: target, iso: ti };
			days.push(moved);
			shifted.push({
				fromIso: d.iso,
				toIso: ti,
				date: target,
				weekday: WEEKDAYS_FULL[target.getDay()],
				module: d.module,
				volee: config.titre,
			});
		} else {
			displaced.push({
				iso: d.iso,
				date: d.date,
				weekday: WEEKDAYS_FULL[d.date.getDay()],
				module: d.module,
				volee: config.titre,
			});
		}
	}
	days.sort((a, b) => a.date.getTime() - b.date.getTime());

	const moduleCounts: Record<string, number> = {};
	const unknown = new Set<string>();
	let hasEvening = false;
	for (const d of days) {
		moduleCounts[d.module] = (moduleCounts[d.module] ?? 0) + 1;
		if (d.unknownModule) unknown.add(d.module);
		if (d.evening) hasEvening = true;
	}

	return {
		config,
		days,
		displaced,
		shifted,
		moduleCounts,
		total: days.length,
		hasEvening,
		unknownModules: [...unknown],
	};
}

/** Modules present, ordered by programme priority then by descending count. */
export function orderedModules(data: VoleeData): string[] {
	const priority = MODULE_PRIORITY[data.config.prog] ?? [];
	return Object.keys(data.moduleCounts).sort((a, b) => {
		const pa = priority.indexOf(a);
		const pb = priority.indexOf(b);
		const ra = pa === -1 ? Number.MAX_SAFE_INTEGER : pa;
		const rb = pb === -1 ? Number.MAX_SAFE_INTEGER : pb;
		if (ra !== rb) return ra - rb;
		return (data.moduleCounts[b] ?? 0) - (data.moduleCounts[a] ?? 0);
	});
}

/**
 * Automatic schedule hint for a module: weekdays that make up ≥25% of the module's days.
 * "jeudis" if a single weekday, otherwise "Mar. + Mer.".
 */
export function moduleWeekdayHint(days: CourseDay[], module: string): string {
	const modDays = days.filter((d) => d.module === module);
	if (modDays.length === 0) return '';
	const counts = new Array(7).fill(0);
	for (const d of modDays) counts[d.date.getDay()]++;
	const threshold = modDays.length * 0.25;
	const picked: number[] = [];
	for (let wd = 1; wd <= 7; wd++) {
		const idx = wd % 7; // iterate Monday…Sunday
		if (counts[idx] >= threshold && counts[idx] > 0) picked.push(idx);
	}
	if (picked.length === 0) return '';
	if (picked.length === 1) return WEEKDAYS_PLURAL[picked[0]];
	return picked.map((i) => WEEKDAYS_SHORT[i]).join(' + ');
}
