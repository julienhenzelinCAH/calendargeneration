import { Button, Card, Checkbox, Chip, Icon } from '../ds';
import { useStore } from '../store/AppStore';
import { orderedModules } from '../lib/calendar';
import { moduleColor } from '../volees.config';
import type { ScreenKey } from '../App';
import type { Displaced } from '../types';

function YearSelect() {
	const { year, setYear } = useStore();
	const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
	return (
		<select
			value={year}
			onChange={(e) => setYear(Number(e.target.value))}
			style={{
				padding: '9px 12px',
				borderRadius: 'var(--radius-md)',
				border: '1px solid var(--color-gold)',
				fontSize: 15,
				fontFamily: 'var(--font-intl-book)',
				background: '#fff',
				color: 'var(--text-body)',
			}}
		>
			{years.map((y) => (
				<option key={y} value={y}>
					{y}–{y + 1}
				</option>
			))}
		</select>
	);
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (b: boolean) => void; label: string }) {
	return (
		<button
			onClick={() => onChange(!on)}
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 10,
				border: 'none',
				background: 'transparent',
				cursor: 'pointer',
				fontFamily: 'var(--font-intl)',
				fontSize: 14,
				color: 'var(--text-body)',
			}}
		>
			<span
				style={{
					width: 40,
					height: 22,
					borderRadius: 9999,
					background: on ? 'var(--color-gold)' : 'var(--zinc-300)',
					position: 'relative',
					transition: 'background-color 150ms',
					flexShrink: 0,
				}}
			>
				<span
					style={{
						position: 'absolute',
						top: 2,
						left: on ? 20 : 2,
						width: 18,
						height: 18,
						borderRadius: '50%',
						background: '#fff',
						transition: 'left 150ms',
						boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
					}}
				/>
			</span>
			{label}
		</button>
	);
}

export function Dashboard({ goto }: { goto: (s: ScreenKey) => void }) {
	const store = useStore();
	const { volees, selectedIds, year, projection } = store;

	const allDisplaced: Displaced[] = [];
	for (const v of volees) {
		if (!selectedIds.includes(v.id)) continue;
		const data = store.voleeData(v);
		if (data) allDisplaced.push(...data.displaced);
	}
	allDisplaced.sort((a, b) => a.date.getTime() - b.date.getTime());

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<Card>
				<div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						<span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-intl-book)' }}>Année scolaire</span>
						<YearSelect />
					</div>
					<div style={{ width: 1, alignSelf: 'stretch', background: 'var(--zinc-200)' }} />
					<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
						<span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-intl-book)' }}>Projection</span>
						<Toggle on={projection} onChange={store.setProjection} label="Projection +1 an (décale de 364 j)" />
					</div>
					<div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
						<Button variant="neutral" size="sm" onClick={() => store.setAllSelected(true)}>
							Tout cocher
						</Button>
						<Button variant="neutral" size="sm" onClick={() => store.setAllSelected(false)}>
							Tout décocher
						</Button>
						<Button size="sm" icon="calendar-days" onClick={() => goto('apercu')}>
							Aperçu & PDF
						</Button>
					</div>
				</div>
				{projection && (
					<p style={{ margin: '14px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
						Les dates lues sont décalées de +364 jours (les jours de semaine sont préservés) pour projeter le rythme sur {year}–{year + 1}.
					</p>
				)}
			</Card>

			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
				{volees.map((v) => {
					const data = store.voleeData(v);
					const selected = selectedIds.includes(v.id);
					const mods = data ? orderedModules(data) : [];
					return (
						<div
							key={v.id}
							style={{
								background: '#fff',
								border: `1px solid ${selected ? 'rgba(202,158,103,0.5)' : 'var(--border-card)'}`,
								borderRadius: 'var(--radius-lg)',
								boxShadow: 'var(--shadow-card)',
								padding: 18,
							}}
						>
							<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
								<Checkbox checked={selected} onChange={() => store.toggleSelected(v.id)} />
								<div style={{ flex: 1, minWidth: 0 }}>
									<div style={{ fontSize: 16, fontFamily: 'var(--font-intl-book)', fontWeight: 600, color: 'var(--text-body)' }}>
										{v.titre}
									</div>
									<div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{v.sousTitre}</div>
								</div>
								<Chip tone="gold">{v.prog}</Chip>
							</div>

							<div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 8 }}>
								{data ? (
									<>
										<span style={{ fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-intl-book)', color: 'var(--text-body)' }}>
											{data.total}
										</span>
										<span style={{ fontSize: 13, color: 'var(--text-muted)' }}>jours au total</span>
									</>
								) : (
									<span style={{ fontSize: 13, color: 'var(--text-faint)' }}>
										<Icon name="information-circle" size={15} style={{ marginRight: 4 }} />
										Données non chargées
									</span>
								)}
							</div>

							{data && (
								<div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
									{mods.map((m) => {
										const c = moduleColor(store.palettes, v.prog, m);
										return (
											<span
												key={m}
												style={{
													display: 'inline-flex',
													alignItems: 'center',
													gap: 5,
													padding: '3px 8px',
													borderRadius: 'var(--radius-sm)',
													background: c.light,
													color: c.dark,
													fontSize: 12.5,
													fontWeight: 600,
													fontFamily: 'var(--font-intl)',
												}}
											>
												{m}×{data.moduleCounts[m]}
											</span>
										);
									})}
								</div>
							)}

							{data && data.unknownModules.length > 0 && (
								<p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--orange-600)' }}>
									<Icon name="exclamation-triangle" size={13} style={{ marginRight: 4 }} />
									Module(s) inconnu(s)&nbsp;: {data.unknownModules.join(', ')}
								</p>
							)}
							{data && data.displaced.length > 0 && (
								<p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--red-600)' }}>
									{data.displaced.length} cours à reporter (collision férié)
								</p>
							)}
						</div>
					);
				})}
			</div>

			{allDisplaced.length > 0 && (
				<Card
					title="Cours à reporter"
					subtitle="Jours de cours tombant sur un férié — retirés de la grille et décomptés"
					icon={<Icon name="exclamation-triangle" size={22} style={{ color: 'var(--red-600)' }} />}
				>
					<div style={{ overflowX: 'auto' }}>
						<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
							<thead>
								<tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 12.5 }}>
									<th style={{ padding: '6px 10px', fontWeight: 500 }}>Date</th>
									<th style={{ padding: '6px 10px', fontWeight: 500 }}>Jour</th>
									<th style={{ padding: '6px 10px', fontWeight: 500 }}>Module</th>
									<th style={{ padding: '6px 10px', fontWeight: 500 }}>Volée</th>
								</tr>
							</thead>
							<tbody>
								{allDisplaced.map((d, i) => (
									<tr key={`${d.volee}-${d.iso}-${i}`} style={{ borderTop: '1px solid var(--zinc-100)' }}>
										<td style={{ padding: '8px 10px', fontFamily: 'ui-monospace, monospace' }}>
											{d.date.toLocaleDateString('fr-CH')}
										</td>
										<td style={{ padding: '8px 10px' }}>{d.weekday}</td>
										<td style={{ padding: '8px 10px' }}>{d.module}</td>
										<td style={{ padding: '8px 10px' }}>{d.volee}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Card>
			)}
		</div>
	);
}
