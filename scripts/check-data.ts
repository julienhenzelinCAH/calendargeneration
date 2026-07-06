/**
 * Data sanity check against the real public Google Sheet.
 * Loads "MTE Salvia 12 2 ans" and prints day counts per module.
 * Expected: 133 days total · M2=76 · M1=45 · MP=12
 *
 * Run: npm run check-data
 */
import { fetchSheetTab } from '../src/lib/csv';
import { buildVoleeData } from '../src/lib/calendar';
import { DEFAULT_SHEET_ID, DEFAULT_VOLEES } from '../src/volees.config';

async function main() {
	const config = DEFAULT_VOLEES.find((v) => v.onglet === 'MTE Salvia 12 2 ans')!;
	console.log(`Chargement de l'onglet « ${config.onglet} » …`);
	const rows = await fetchSheetTab(DEFAULT_SHEET_ID, config.onglet);
	// No holidays removed here — we validate raw parsing/classification counts.
	const data = buildVoleeData(rows, config, []);

	console.log(`\nJours au total : ${data.total}`);
	const order = ['M2', 'M1', 'MP'];
	for (const m of order) {
		console.log(`  ${m} = ${data.moduleCounts[m] ?? 0}`);
	}
	const others = Object.keys(data.moduleCounts).filter((m) => !order.includes(m));
	for (const m of others) console.log(`  ${m} = ${data.moduleCounts[m]} (inattendu)`);

	const expect = { total: 133, M2: 76, M1: 45, MP: 12 };
	const ok =
		data.total === expect.total &&
		data.moduleCounts.M2 === expect.M2 &&
		data.moduleCounts.M1 === expect.M1 &&
		data.moduleCounts.MP === expect.MP;
	console.log(`\nRésultat attendu : 133 total · M2=76 · M1=45 · MP=12`);
	console.log(ok ? '✓ Chiffres conformes.' : '✗ Chiffres NON conformes.');
	process.exit(ok ? 0 : 1);
}

main().catch((err) => {
	console.error('Erreur :', err.message);
	process.exit(2);
});
