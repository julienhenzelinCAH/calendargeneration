export type Programme = 'MTE' | 'AYU' | 'PASS' | 'TC' | 'KINE' | 'REFL' | 'CRAN' | 'MTC' | 'HOM';

export type ModuleColor = { dark: string; light: string };

/** Configuration of a single volée (cohort) mapping a sheet tab to a programme. */
export interface VoleeConfig {
	id: string;
	onglet: string;
	prog: Programme;
	titre: string;
	sousTitre: string;
}

/** One session (half-day) read from the sheet. */
export interface Session {
	date: Date;
	module: string; // raw module code from column F (may be unknown)
	description: string; // column G
	horaire: string; // column D
	isExam: boolean;
	evening: boolean; // evening / online session inferred from the horaire (e.g. 18h–22h en ligne)
}

/** A calendar day of courses after aggregation of its sessions. */
export interface CourseDay {
	date: Date;
	iso: string; // yyyy-mm-dd
	module: string; // dominant module for the day
	isExam: boolean; // any session that day is an exam
	evening: boolean; // the day is an evening / online session (18h–22h en ligne)
	sessionCount: number;
	unknownModule: boolean;
}

/** A course day moved to a nearby free date to avoid a holiday (projection mode). */
export interface Shifted {
	fromIso: string;
	toIso: string;
	date: Date; // the new (shifted) date
	weekday: string;
	module: string;
	volee: string;
}

/** A user-editable holiday (jour férié). */
export interface Holiday {
	id: string;
	date: string; // yyyy-mm-dd
	label: string;
}

/** A user-editable vacation range (informative). */
export interface Vacation {
	id: string;
	start: string; // yyyy-mm-dd
	end: string; // yyyy-mm-dd
	label: string;
}

/** A course displaced by a collision with a holiday. */
export interface Displaced {
	iso: string;
	date: Date;
	weekday: string;
	module: string;
	volee: string;
}

/** Fully computed data for one volée in one school year. */
export interface VoleeData {
	config: VoleeConfig;
	days: CourseDay[]; // kept days (holidays removed / shifted)
	displaced: Displaced[]; // dropped because of a holiday collision (non-projection)
	shifted: Shifted[]; // moved to a nearby free date to preserve the count (projection)
	moduleCounts: Record<string, number>;
	total: number;
	hasEvening: boolean;
	unknownModules: string[];
}

export type SheetLoader = (onglet: string) => Promise<string[][]>;
