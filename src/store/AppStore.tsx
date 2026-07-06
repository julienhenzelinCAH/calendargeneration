import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Holiday, ModuleColor, Programme, Vacation, VoleeConfig, VoleeData } from '../types';
import {
	DEFAULT_FOOTERS,
	DEFAULT_PALETTES,
	DEFAULT_SHEET_ID,
	DEFAULT_VOLEES,
} from '../volees.config';
import { buildVoleeData, parseSharedSessions, vaudHolidays } from '../lib/calendar';
import type { Session } from '../types';
import { fetchSheetTab, sheetIdFromInput } from '../lib/csv';
import { lsGet, lsSet } from './storage';
import { ALL_PROGRAMMES } from '../volees.config';

const PROJECTION_OFFSET = 364;

/** Merge default palettes into a persisted value so newly added programmes/modules appear. */
function mergePalettes(
	stored: Record<Programme, Record<string, ModuleColor>>,
): Record<Programme, Record<string, ModuleColor>> {
	const out = {} as Record<Programme, Record<string, ModuleColor>>;
	for (const prog of ALL_PROGRAMMES) {
		out[prog] = { ...DEFAULT_PALETTES[prog], ...(stored?.[prog] ?? {}) };
	}
	return out;
}

/** Merge default footers so newly added programmes have a default line. */
function mergeFooters(stored: Record<Programme, string>): Record<Programme, string> {
	const out = {} as Record<Programme, string>;
	for (const prog of ALL_PROGRAMMES) {
		out[prog] = stored?.[prog] ?? DEFAULT_FOOTERS[prog];
	}
	return out;
}

export type TabStatus = 'idle' | 'loading' | 'ok' | 'error';

interface AppStoreValue {
	// config
	sheetId: string;
	setSheetId: (v: string) => void;
	volees: VoleeConfig[];
	setVolees: (v: VoleeConfig[]) => void;
	palettes: Record<Programme, Record<string, ModuleColor>>;
	setPalettes: (v: Record<Programme, Record<string, ModuleColor>>) => void;
	footers: Record<Programme, string>;
	setFooters: (v: Record<Programme, string>) => void;
	// year & projection
	year: number; // start year (N of N–N+1)
	setYear: (y: number) => void;
	projection: boolean;
	setProjection: (b: boolean) => void;
	// holidays / vacations for current year
	holidays: Holiday[];
	setHolidays: (h: Holiday[]) => void;
	prefillHolidays: () => void;
	vacations: Vacation[];
	setVacations: (v: Vacation[]) => void;
	// selection
	selectedIds: string[];
	toggleSelected: (id: string) => void;
	setAllSelected: (on: boolean) => void;
	// data loading
	statuses: Record<string, TabStatus>;
	loading: boolean;
	loadError: string | null;
	loadAll: () => Promise<void>;
	testConnection: () => Promise<void>;
	setManualCsv: (onglet: string, matrix: string[][]) => void;
	hasData: (onglet: string) => boolean;
	// computed
	voleeData: (config: VoleeConfig) => VoleeData | null;
}

const Ctx = createContext<AppStoreValue | null>(null);

export function useStore(): AppStoreValue {
	const v = useContext(Ctx);
	if (!v) throw new Error('useStore must be used within AppStoreProvider');
	return v;
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
	const [sheetId, setSheetIdRaw] = useState<string>(() => lsGet('cah_sheetId', DEFAULT_SHEET_ID));
	const [volees, setVoleesRaw] = useState<VoleeConfig[]>(() => lsGet('cah_volees', DEFAULT_VOLEES));
	const [palettes, setPalettesRaw] = useState<Record<Programme, Record<string, ModuleColor>>>(() =>
		mergePalettes(lsGet('cah_palettes', DEFAULT_PALETTES)),
	);
	const [footers, setFootersRaw] = useState<Record<Programme, string>>(() =>
		mergeFooters(lsGet('cah_footers', DEFAULT_FOOTERS)),
	);
	const [year, setYearRaw] = useState<number>(() => lsGet('cah_year', 2026));
	const [projection, setProjectionRaw] = useState<boolean>(() => lsGet('cah_projection', false));

	const [holidays, setHolidaysState] = useState<Holiday[]>(() =>
		lsGet(`cah_holidays_${lsGet('cah_year', 2026)}`, vaudHolidays(lsGet('cah_year', 2026))),
	);
	const [vacations, setVacationsState] = useState<Vacation[]>(() =>
		lsGet(`cah_vacations_${lsGet('cah_year', 2026)}`, []),
	);

	const [selectedIds, setSelectedIds] = useState<string[]>(() => lsGet('cah_volees', DEFAULT_VOLEES).map((v) => v.id));
	const [raw, setRaw] = useState<Record<string, string[][]>>({});
	const [statuses, setStatuses] = useState<Record<string, TabStatus>>({});
	const [loading, setLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);

	// —— persisted setters ——
	const setSheetId = useCallback((v: string) => {
		setSheetIdRaw(v);
		lsSet('cah_sheetId', v);
	}, []);
	const setVolees = useCallback((v: VoleeConfig[]) => {
		setVoleesRaw(v);
		lsSet('cah_volees', v);
		setSelectedIds((prev) => prev.filter((id) => v.some((x) => x.id === id)));
	}, []);
	const setPalettes = useCallback((v: Record<Programme, Record<string, ModuleColor>>) => {
		setPalettesRaw(v);
		lsSet('cah_palettes', v);
	}, []);
	const setFooters = useCallback((v: Record<Programme, string>) => {
		setFootersRaw(v);
		lsSet('cah_footers', v);
	}, []);

	const setHolidays = useCallback(
		(h: Holiday[]) => {
			setHolidaysState(h);
			lsSet(`cah_holidays_${year}`, h);
		},
		[year],
	);
	const setVacations = useCallback(
		(v: Vacation[]) => {
			setVacationsState(v);
			lsSet(`cah_vacations_${year}`, v);
		},
		[year],
	);
	const prefillHolidays = useCallback(() => {
		const h = vaudHolidays(year);
		setHolidaysState(h);
		lsSet(`cah_holidays_${year}`, h);
	}, [year]);

	const setYear = useCallback((y: number) => {
		setYearRaw(y);
		lsSet('cah_year', y);
		// load (or pre-fill) holidays & vacations for the new year
		const h = lsGet<Holiday[] | null>(`cah_holidays_${y}`, null);
		if (h) setHolidaysState(h);
		else {
			const pre = vaudHolidays(y);
			setHolidaysState(pre);
			lsSet(`cah_holidays_${y}`, pre);
		}
		setVacationsState(lsGet(`cah_vacations_${y}`, []));
	}, []);

	const setProjection = useCallback((b: boolean) => {
		setProjectionRaw(b);
		lsSet('cah_projection', b);
	}, []);

	// —— selection ——
	const toggleSelected = useCallback((id: string) => {
		setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
	}, []);
	const setAllSelected = useCallback(
		(on: boolean) => {
			setSelectedIds(on ? volees.map((v) => v.id) : []);
		},
		[volees],
	);

	// —— data loading ——
	const loadAll = useCallback(async () => {
		setLoading(true);
		setLoadError(null);
		const id = sheetIdFromInput(sheetId);
		const next: Record<string, string[][]> = {};
		const nextStatus: Record<string, TabStatus> = {};
		let anyError = false;
		await Promise.all(
			volees.map(async (v) => {
				nextStatus[v.onglet] = 'loading';
				try {
					const matrix = await fetchSheetTab(id, v.onglet);
					next[v.onglet] = matrix;
					nextStatus[v.onglet] = 'ok';
				} catch {
					nextStatus[v.onglet] = 'error';
					anyError = true;
				}
			}),
		);
		setRaw((prev) => ({ ...prev, ...next }));
		setStatuses(nextStatus);
		setLoading(false);
		if (anyError) {
			setLoadError(
				'Certains onglets n’ont pas pu être chargés (CORS ou partage insuffisant). Vérifie le partage « Tout utilisateur disposant du lien : Lecteur », ou utilise l’import manuel de CSV.',
			);
		}
	}, [sheetId, volees]);

	const testConnection = useCallback(async () => {
		const id = sheetIdFromInput(sheetId);
		const nextStatus: Record<string, TabStatus> = {};
		volees.forEach((v) => (nextStatus[v.onglet] = 'loading'));
		setStatuses({ ...nextStatus });
		await Promise.all(
			volees.map(async (v) => {
				try {
					await fetchSheetTab(id, v.onglet);
					nextStatus[v.onglet] = 'ok';
				} catch {
					nextStatus[v.onglet] = 'error';
				}
				setStatuses({ ...nextStatus });
			}),
		);
	}, [sheetId, volees]);

	const setManualCsv = useCallback((onglet: string, matrix: string[][]) => {
		setRaw((prev) => ({ ...prev, [onglet]: matrix }));
		setStatuses((prev) => ({ ...prev, [onglet]: 'ok' }));
	}, []);

	const hasData = useCallback((onglet: string) => !!raw[onglet], [raw]);

	const voleeData = useCallback(
		(config: VoleeConfig): VoleeData | null => {
			const matrix = raw[config.onglet];
			if (!matrix) return null;
			const offset = projection ? PROJECTION_OFFSET : 0;
			// Merge modules taught jointly with another volée (e.g. AYU reuses MTE's M1/MP dates).
			const extra: Session[] = [];
			for (const sh of config.shared ?? []) {
				const src = volees.find((v) => v.id === sh.sourceId);
				const srcRows = src ? raw[src.onglet] : undefined;
				if (srcRows) extra.push(...parseSharedSessions(srcRows, sh.modules, offset));
			}
			return buildVoleeData(matrix, config, holidays, offset, extra);
		},
		[raw, holidays, projection, volees],
	);

	const value = useMemo<AppStoreValue>(
		() => ({
			sheetId,
			setSheetId,
			volees,
			setVolees,
			palettes,
			setPalettes,
			footers,
			setFooters,
			year,
			setYear,
			projection,
			setProjection,
			holidays,
			setHolidays,
			prefillHolidays,
			vacations,
			setVacations,
			selectedIds,
			toggleSelected,
			setAllSelected,
			statuses,
			loading,
			loadError,
			loadAll,
			testConnection,
			setManualCsv,
			hasData,
			voleeData,
		}),
		[
			sheetId, setSheetId, volees, setVolees, palettes, setPalettes, footers, setFooters,
			year, setYear, projection, setProjection, holidays, setHolidays, prefillHolidays,
			vacations, setVacations, selectedIds, toggleSelected, setAllSelected, statuses,
			loading, loadError, loadAll, testConnection, setManualCsv, hasData, voleeData,
		],
	);

	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
