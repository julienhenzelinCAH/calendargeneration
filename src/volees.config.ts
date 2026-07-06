import type { Programme, VoleeConfig, ModuleColor } from './types';

export const DEFAULT_SHEET_ID = '1xs5ITD4QqztwhFVNn4wOT07RgUK837iKnRl-xV1KWT0';

export const DEFAULT_VOLEES: VoleeConfig[] = [
	{ id: 'salvia', onglet: 'MTE Salvia 12 2 ans', prog: 'MTE', titre: 'MTE Salvia', sousTitre: 'Volée Salvia (A1) · 2 ans' },
	{ id: 'viola', onglet: 'MTE Viola 22 2 ans', prog: 'MTE', titre: 'MTE Viola', sousTitre: 'Volée Viola (A2) · 2 ans' },
	{ id: 'gentiana', onglet: 'MTE Gentiana 13 3 ans', prog: 'MTE', titre: 'MTE Gentiana', sousTitre: 'Volée Gentiana (A1) · 3 ans' },
	{ id: 'malva', onglet: 'MTE Malva 23 3 ans', prog: 'MTE', titre: 'MTE Malva', sousTitre: 'Volée Malva (A2) · 3 ans' },
	{ id: 'arnica', onglet: 'MTE Arnica 33 3 ans', prog: 'MTE', titre: 'MTE Arnica', sousTitre: 'Volée Arnica (A3) · 3 ans' },
	{ id: 'bilva', onglet: 'AYU THE Bilva 13 3 ans', prog: 'AYU', titre: 'AYU Bilva', sousTitre: 'Volée Bilva (A1) · 3 ans · théorie' },
	{ id: 'asoka', onglet: 'AYU Asoka 23 3 ans', prog: 'AYU', titre: 'AYU Asoka', sousTitre: 'Volée Asoka (A2) · 3 ans' },
	{ id: 'rosmarinus', onglet: 'PASS Rosmarinus 26-27', prog: 'PASS', titre: 'PASS Rosmarinus', sousTitre: 'Volée Rosmarinus · Année passerelle' },
	{ id: 'neon', onglet: 'Com TC Neon 26-26', prog: 'TC', titre: 'Tronc commun Néon', sousTitre: 'Volée Néon (A1) · Ortra TC' },
];

/** Dark colour = number text, light colour = pastille background. Per programme. */
export const DEFAULT_PALETTES: Record<Programme, Record<string, ModuleColor>> = {
	MTE: {
		M2: { dark: '#2f9d78', light: '#d8eee6' },
		M1: { dark: '#004898', light: '#d5e2ea' },
		MP: { dark: '#8c6c46', light: '#ece3d3' },
	},
	PASS: {
		M2: { dark: '#2f9d78', light: '#d8eee6' },
		M1: { dark: '#004898', light: '#d5e2ea' },
		MP: { dark: '#8c6c46', light: '#ece3d3' },
	},
	AYU: {
		M2: { dark: '#c2682a', light: '#f6e2cf' }, // safran
		M1: { dark: '#004898', light: '#d5e2ea' },
		MP: { dark: '#8c6c46', light: '#ece3d3' },
	},
	TC: {
		BM1: { dark: '#0bb4cd', light: '#d4f0f4' },
		BM2: { dark: '#004898', light: '#d5e2ea' },
		BM3: { dark: '#7a45e0', light: '#e7def8' },
		BP1: { dark: '#9c1f8c', light: '#f1d9ef' },
		BP2: { dark: '#e8701a', light: '#fbe7d5' },
		BS: { dark: '#1f9d1f', light: '#d7edd0' },
	},
};

/** Module priority for tie-breaking the dominant module of a day. */
export const MODULE_PRIORITY: Record<Programme, string[]> = {
	MTE: ['M2', 'M1', 'MP'],
	AYU: ['M2', 'M1', 'MP'],
	PASS: ['M1', 'M2', 'MP'],
	TC: ['BS', 'BM2', 'BM3', 'BM1', 'BP1', 'BP2'],
};

export const UNKNOWN_MODULE_COLOR: ModuleColor = { dark: '#71717a', light: '#e4e4e7' };

/** Footer main line per programme (§5.6). */
export const DEFAULT_FOOTERS: Record<Programme, string> = {
	MTE: 'DIPLÔMES FÉDÉRAUX ORTRA MA · MÉDECINE TRADITIONNELLE NATURELLE EUROPÉENNE',
	AYU: 'DIPLÔMES FÉDÉRAUX ORTRA MA · AYURVÉDA',
	PASS: 'ANNÉE PASSERELLE · CONNAISSANCES MÉDICALES ORTRA',
	TC: 'DIPLÔMES FÉDÉRAUX ORTRA TC · TRONC COMMUN',
};

export const FOOTER_SUBLINE =
	'FORMER LES THÉRAPEUTES DE DEMAIN EN MÉDECINE TRADITIONNELLE COMPLÉMENTAIRE & INTÉGRATIVE';

export function moduleColor(
	palettes: Record<Programme, Record<string, ModuleColor>>,
	prog: Programme,
	module: string,
): ModuleColor {
	return palettes[prog]?.[module] ?? UNKNOWN_MODULE_COLOR;
}
