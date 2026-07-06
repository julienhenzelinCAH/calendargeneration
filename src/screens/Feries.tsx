import { Button, Card, Icon } from '../ds';
import { useStore } from '../store/AppStore';
import { uid } from '../store/storage';
import type { Holiday, Vacation } from '../types';

const cellInput: React.CSSProperties = {
	padding: '7px 9px',
	borderRadius: 'var(--radius-md)',
	border: '1px solid var(--zinc-300)',
	fontSize: 14,
	fontFamily: 'var(--font-intl)',
	background: '#fff',
	width: '100%',
	boxSizing: 'border-box',
};

function IconBtn({ onClick, name, danger }: { onClick: () => void; name: string; danger?: boolean }) {
	return (
		<button
			onClick={onClick}
			style={{
				border: 'none',
				background: 'transparent',
				cursor: 'pointer',
				color: danger ? 'var(--red-600)' : 'var(--text-muted)',
				display: 'flex',
				padding: 6,
				borderRadius: 'var(--radius-sm)',
			}}
		>
			<Icon name={name} size={18} />
		</button>
	);
}

export function Feries() {
	const store = useStore();
	const { holidays, vacations, year } = store;

	function updHoliday(id: string, patch: Partial<Holiday>) {
		store.setHolidays(holidays.map((h) => (h.id === id ? { ...h, ...patch } : h)));
	}
	function updVacation(id: string, patch: Partial<Vacation>) {
		store.setVacations(vacations.map((v) => (v.id === id ? { ...v, ...patch } : v)));
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<Card
				title="Fériés"
				subtitle={`Un X rouge sur la grille · année ${year}–${year + 1}`}
				icon={<Icon name="calendar" size={22} style={{ color: 'var(--color-gold)' }} />}
				right={
					<div style={{ display: 'flex', gap: 8 }}>
						<Button variant="outline" size="sm" icon="arrow-path" onClick={store.prefillHolidays}>
							Pré-remplir (Vaud)
						</Button>
						<Button
							size="sm"
							icon="plus"
							onClick={() =>
								store.setHolidays([...holidays, { id: uid('h'), date: `${year}-12-25`, label: 'Nouveau férié' }])
							}
						>
							Ajouter
						</Button>
					</div>
				}
			>
				<div style={{ overflowX: 'auto' }}>
					<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
						<thead>
							<tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 12.5 }}>
								<th style={{ padding: '6px 10px', fontWeight: 500, width: 180 }}>Date</th>
								<th style={{ padding: '6px 10px', fontWeight: 500 }}>Libellé</th>
								<th style={{ width: 44 }} />
							</tr>
						</thead>
						<tbody>
							{holidays.length === 0 && (
								<tr>
									<td colSpan={3} style={{ padding: '16px 10px', color: 'var(--text-faint)' }}>
										Aucun férié. Utilise « Pré-remplir (Vaud) » pour calculer les fériés vaudois.
									</td>
								</tr>
							)}
							{[...holidays]
								.sort((a, b) => a.date.localeCompare(b.date))
								.map((h) => (
									<tr key={h.id} style={{ borderTop: '1px solid var(--zinc-100)' }}>
										<td style={{ padding: '6px 10px' }}>
											<input type="date" value={h.date} onChange={(e) => updHoliday(h.id, { date: e.target.value })} style={cellInput} />
										</td>
										<td style={{ padding: '6px 10px' }}>
											<input value={h.label} onChange={(e) => updHoliday(h.id, { label: e.target.value })} style={cellInput} />
										</td>
										<td style={{ padding: '6px 4px', textAlign: 'right' }}>
											<IconBtn name="trash" danger onClick={() => store.setHolidays(holidays.filter((x) => x.id !== h.id))} />
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>
			</Card>

			<Card
				title="Vacances"
				subtitle="Informatives — affichées à côté de l’aperçu (pas de rendu sur la grille en v1)"
				icon={<Icon name="calendar-days" size={22} style={{ color: 'var(--color-gold)' }} />}
				right={
					<Button
						size="sm"
						icon="plus"
						onClick={() =>
							store.setVacations([
								...vacations,
								{ id: uid('v'), start: `${year}-10-13`, end: `${year}-10-24`, label: 'Vacances d’automne' },
							])
						}
					>
						Ajouter
					</Button>
				}
			>
				<div style={{ overflowX: 'auto' }}>
					<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
						<thead>
							<tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 12.5 }}>
								<th style={{ padding: '6px 10px', fontWeight: 500, width: 170 }}>Début</th>
								<th style={{ padding: '6px 10px', fontWeight: 500, width: 170 }}>Fin</th>
								<th style={{ padding: '6px 10px', fontWeight: 500 }}>Libellé</th>
								<th style={{ width: 44 }} />
							</tr>
						</thead>
						<tbody>
							{vacations.length === 0 && (
								<tr>
									<td colSpan={4} style={{ padding: '16px 10px', color: 'var(--text-faint)' }}>
										Aucune plage de vacances.
									</td>
								</tr>
							)}
							{[...vacations]
								.sort((a, b) => a.start.localeCompare(b.start))
								.map((v) => (
									<tr key={v.id} style={{ borderTop: '1px solid var(--zinc-100)' }}>
										<td style={{ padding: '6px 10px' }}>
											<input type="date" value={v.start} onChange={(e) => updVacation(v.id, { start: e.target.value })} style={cellInput} />
										</td>
										<td style={{ padding: '6px 10px' }}>
											<input type="date" value={v.end} onChange={(e) => updVacation(v.id, { end: e.target.value })} style={cellInput} />
										</td>
										<td style={{ padding: '6px 10px' }}>
											<input value={v.label} onChange={(e) => updVacation(v.id, { label: e.target.value })} style={cellInput} />
										</td>
										<td style={{ padding: '6px 4px', textAlign: 'right' }}>
											<IconBtn name="trash" danger onClick={() => store.setVacations(vacations.filter((x) => x.id !== v.id))} />
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>
			</Card>
		</div>
	);
}
