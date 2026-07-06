import { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Icon } from '../ds';
import { useStore } from '../store/AppStore';

/**
 * Manual CSV upload fallback (§8): drag & drop one file per tab.
 * The file base name (without extension) is matched to a volée's onglet name;
 * otherwise the user picks the target tab.
 */
export function CsvUpload() {
	const { volees, setManualCsv, statuses } = useStore();
	const [drag, setDrag] = useState(false);
	const [target, setTarget] = useState<string>(volees[0]?.onglet ?? '');
	const inputRef = useRef<HTMLInputElement>(null);

	function handleFiles(files: FileList | null) {
		if (!files) return;
		Array.from(files).forEach((file) => {
			const base = file.name.replace(/\.csv$/i, '').trim();
			const matched = volees.find((v) => v.onglet.toLowerCase() === base.toLowerCase());
			const onglet = matched?.onglet ?? target;
			Papa.parse<string[]>(file, {
				skipEmptyLines: false,
				complete: (res) => {
					const matrix = (res.data || []).map((row) => (Array.isArray(row) ? row.map((c) => (c ?? '').toString()) : []));
					setManualCsv(onglet, matrix);
				},
			});
		});
	}

	return (
		<div>
			<div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
				<label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Onglet cible par défaut&nbsp;:</label>
				<select
					value={target}
					onChange={(e) => setTarget(e.target.value)}
					style={{
						padding: '8px 10px',
						borderRadius: 'var(--radius-md)',
						border: '1px solid var(--zinc-300)',
						fontSize: 13,
						fontFamily: 'var(--font-intl)',
						background: '#fff',
					}}
				>
					{volees.map((v) => (
						<option key={v.id} value={v.onglet}>
							{v.onglet}
						</option>
					))}
				</select>
			</div>
			<div
				onDragOver={(e) => {
					e.preventDefault();
					setDrag(true);
				}}
				onDragLeave={() => setDrag(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDrag(false);
					handleFiles(e.dataTransfer.files);
				}}
				onClick={() => inputRef.current?.click()}
				style={{
					border: `2px dashed ${drag ? 'var(--color-gold)' : 'var(--zinc-300)'}`,
					background: drag ? 'var(--color-creme)' : 'var(--zinc-50)',
					borderRadius: 'var(--radius-lg)',
					padding: '28px 20px',
					textAlign: 'center',
					cursor: 'pointer',
					transition: 'all 150ms',
				}}
			>
				<Icon name="cloud-arrow-up" size={32} style={{ color: 'var(--color-gold)' }} />
				<p style={{ margin: '8px 0 2px', fontSize: 15, fontFamily: 'var(--font-intl-book)', color: 'var(--text-body)' }}>
					Glisse-dépose des fichiers CSV (un par onglet)
				</p>
				<p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
					Nomme le fichier comme l’onglet (ex. « MTE Salvia 12 2 ans.csv ») pour l’associer automatiquement.
				</p>
				<input
					ref={inputRef}
					type="file"
					accept=".csv,text/csv"
					multiple
					onChange={(e) => handleFiles(e.target.files)}
					style={{ display: 'none' }}
				/>
			</div>
			<ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
				{volees.map((v) => (
					<li
						key={v.id}
						style={{
							fontSize: 12,
							padding: '4px 8px',
							borderRadius: 'var(--radius-sm)',
							border: '1px solid var(--zinc-200)',
							color: statuses[v.onglet] === 'ok' ? 'var(--emerald-700)' : 'var(--text-muted)',
							background: statuses[v.onglet] === 'ok' ? 'rgba(236,253,245,0.6)' : '#fff',
						}}
					>
						{statuses[v.onglet] === 'ok' ? '✓ ' : '· '}
						{v.onglet}
					</li>
				))}
			</ul>
		</div>
	);
}
