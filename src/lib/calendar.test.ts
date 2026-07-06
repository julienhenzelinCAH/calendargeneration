import { describe, it, expect } from 'vitest';
import {
	easterSunday,
	jeuneFederal,
	iso,
	isExam,
	isEveningHoraire,
	dominantModule,
	moduleWeekdayHint,
	vaudHolidays,
	buildVoleeData,
} from './calendar';
import type { VoleeConfig } from '../types';
import { parseDateLocal } from './csv';
import type { CourseDay } from '../types';

describe('computus (easterSunday)', () => {
	it('Pâques 2027 = 28.03.2027', () => {
		expect(iso(easterSunday(2027))).toBe('2027-03-28');
	});
	it('Pâques 2028 = 16.04.2028', () => {
		expect(iso(easterSunday(2028))).toBe('2028-04-16');
	});
	it('Pâques 2026 = 05.04.2026', () => {
		expect(iso(easterSunday(2026))).toBe('2026-04-05');
	});
});

describe('jeûne fédéral', () => {
	it('2026 = 21.09.2026', () => {
		expect(iso(jeuneFederal(2026))).toBe('2026-09-21');
	});
	it('2027 = 20.09.2027', () => {
		expect(iso(jeuneFederal(2027))).toBe('2027-09-20');
	});
});

describe('vaudHolidays (2026 school year)', () => {
	const hols = vaudHolidays(2026);
	const byLabel = (l: string) => hols.find((h) => h.label === l)?.date;
	it('contains Vendredi Saint 2027 (Pâques 2027-03-28 − 2)', () => {
		expect(byLabel('Vendredi Saint')).toBe('2027-03-26');
	});
	it('contains Ascension 2027 (Pâques + 39)', () => {
		expect(byLabel('Ascension')).toBe('2027-05-06');
	});
	it('contains Jeûne fédéral of year N (2026)', () => {
		expect(byLabel('Lundi du Jeûne fédéral')).toBe('2026-09-21');
	});
	it('Noël and Nouvel An', () => {
		expect(byLabel('Noël')).toBe('2026-12-25');
		expect(byLabel('Nouvel An')).toBe('2027-01-01');
	});
});

describe('parseDateLocal', () => {
	it('parses dd.mm.yyyy in local time', () => {
		const d = parseDateLocal('05.04.2026')!;
		expect(d.getFullYear()).toBe(2026);
		expect(d.getMonth()).toBe(3);
		expect(d.getDate()).toBe(5);
	});
	it('parses yyyy-mm-dd without UTC shift', () => {
		const d = parseDateLocal('2026-04-05')!;
		expect(iso(d)).toBe('2026-04-05');
	});
	it('parses dd/mm/yyyy', () => {
		expect(iso(parseDateLocal('01/08/2026')!)).toBe('2026-08-01');
	});
	it('rejects garbage', () => {
		expect(parseDateLocal('not a date')).toBeNull();
	});
});

describe('isExam', () => {
	it('detects exam keywords', () => {
		expect(isExam('Examen final')).toBe(true);
		expect(isExam('Évaluation module')).toBe(true);
		expect(isExam('Certification')).toBe(true);
		expect(isExam('Partiel M2')).toBe(true);
	});
	it('excludes "complémentaire"', () => {
		expect(isExam('Examens complémentaires')).toBe(false);
	});
	it('ignores plain courses', () => {
		expect(isExam('Anatomie palpatoire')).toBe(false);
	});
});

describe('dominantModule', () => {
	it('picks the module with most sessions', () => {
		expect(dominantModule(['M1', 'M2', 'M2'], 'MTE')).toBe('M2');
	});
	it('breaks ties by MTE priority M2 > M1 > MP', () => {
		expect(dominantModule(['M1', 'M2'], 'MTE')).toBe('M2');
	});
	it('breaks ties by PASS priority M1 > M2', () => {
		expect(dominantModule(['M1', 'M2'], 'PASS')).toBe('M1');
	});
	it('breaks ties by TC priority BS > BM2', () => {
		expect(dominantModule(['BM2', 'BS'], 'TC')).toBe('BS');
	});
});

describe('moduleWeekdayHint', () => {
	const day = (isoStr: string, module: string): CourseDay => ({
		date: parseDateLocal(isoStr)!,
		iso: isoStr,
		module,
		isExam: false,
		evening: false,
		sessionCount: 1,
		unknownModule: false,
	});
	it('returns a single plural weekday', () => {
		// All Thursdays
		const days = ['2026-08-06', '2026-08-13', '2026-08-20'].map((d) => day(d, 'M2'));
		expect(moduleWeekdayHint(days, 'M2')).toBe('jeudis');
	});
});

describe('isEveningHoraire', () => {
	it('detects evening / online sessions', () => {
		expect(isEveningHoraire('18h00-22h00 en ligne')).toBe(true);
		expect(isEveningHoraire('18:00 - 22:00')).toBe(true);
		expect(isEveningHoraire('en ligne')).toBe(true);
	});
	it('ignores full-day sessions', () => {
		expect(isEveningHoraire('08:30-16:30')).toBe(false);
		expect(isEveningHoraire('09h00 à 12h00')).toBe(false);
	});
});

describe('projection preserves the day count (shifts off holidays)', () => {
	const config: VoleeConfig = { id: 't', onglet: 't', prog: 'MTE', titre: 'Test', sousTitre: '' };
	// A Friday course that will collide with Vendredi Saint after projection.
	const rows = [
		['', 'Date', '', 'Horaire', '', 'Module', 'Desc'],
		['', '26.03.2027', '', '08:30-16:30', '', 'M2', ''], // becomes a course; will be projected +364 j
	];
	it('shifts a collided day to a nearby free date instead of dropping it', () => {
		// 26.03.2027 + 364 j = 24.03.2028; make that a holiday to force a shift.
		const holidays = [{ id: 'h', date: '2028-03-24', label: 'Vendredi Saint' }];
		const data = buildVoleeData(rows, config, holidays, 364);
		expect(data.total).toBe(1); // count preserved
		expect(data.displaced.length).toBe(0);
		expect(data.shifted.length).toBe(1);
		expect(data.days[0].iso).not.toBe('2028-03-24');
	});
	it('without projection, a collided day is dropped to displaced', () => {
		const holidays = [{ id: 'h', date: '2027-03-26', label: 'Vendredi Saint' }];
		const data = buildVoleeData(rows, config, holidays, 0);
		expect(data.total).toBe(0);
		expect(data.displaced.length).toBe(1);
		expect(data.shifted.length).toBe(0);
	});
});
