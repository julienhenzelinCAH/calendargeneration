import { useMemo, useState } from 'react';
import { Button, Card, Chip, Icon } from '../ds';
import { useStore } from '../store/AppStore';
import { CalendarPreview } from '../components/CalendarPreview';
import { renderCalendarSVG, type RenderOptions } from '../lib/render';
import { exportGroupPDF, exportVoleePDF } from '../lib/pdf';

export function Apercu() {
	const store = useStore();
	const { volees, year } = store;
	const [idx, setIdx] = useState(0);
	const [busy, setBusy] = useState<null | 'one' | 'group'>(null);

	const current = volees[Math.min(idx, volees.length - 1)];
	const data = current ? store.voleeData(current) : null;

	const svg = useMemo(() => {
		if (!current || !data) return null;
		const opts: RenderOptions = {
			data,
			startYear: year,
			holidays: store.holidays,
			palettes: store.palettes,
			footers: store.footers,
		};
		return renderCalendarSVG(opts);
	}, [current, data, year, store.holidays, store.palettes, store.footers]);

	function optsFor(config: (typeof volees)[number]): RenderOptions | null {
		const d = store.voleeData(config);
		if (!d) return null;
		return { data: d, startYear: year, holidays: store.holidays, palettes: store.palettes, footers: store.footers };
	}

	async function exportOne() {
		if (!current) return;
		const o = optsFor(current);
		if (!o) return;
		setBusy('one');
		try {
			await exportVoleePDF(o);
		} finally {
			setBusy(null);
		}
	}

	async function exportGroup() {
		const list = store.volees
			.filter((v) => store.selectedIds.includes(v.id))
			.map(optsFor)
			.filter((o): o is RenderOptions => o !== null);
		if (list.length === 0) return;
		setBusy('group');
		try {
			await exportGroupPDF(list, year);
		} finally {
			setBusy(null);
		}
	}

	const selectedCount = store.selectedIds.length;

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<Card>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
					<Button
						variant="neutral"
						size="sm"
						icon="chevron-left"
						onClick={() => setIdx((i) => (i - 1 + volees.length) % volees.length)}
					>
						Précédent
					</Button>
					<div style={{ minWidth: 0, flex: 1, textAlign: 'center' }}>
						<div style={{ fontSize: 17, fontFamily: 'var(--font-intl-book)', fontWeight: 600 }}>{current?.titre}</div>
						<div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
							{current?.sousTitre} · {idx + 1}/{volees.length}
						</div>
					</div>
					<Button
						variant="neutral"
						size="sm"
						onClick={() => setIdx((i) => (i + 1) % volees.length)}
						style={{ flexDirection: 'row-reverse' }}
					>
						Suivant
						<Icon name="chevron-right" size={16} />
					</Button>
				</div>
				<div style={{ marginTop: 14, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
					<Button icon="arrow-down-tray" onClick={exportOne} loading={busy === 'one'} disabled={!data}>
						PDF de cette volée
					</Button>
					<Button variant="outline" icon="rectangle-stack" onClick={exportGroup} loading={busy === 'group'} disabled={selectedCount === 0}>
						PDF groupé ({selectedCount} cochée{selectedCount > 1 ? 's' : ''})
					</Button>
				</div>
			</Card>

			{svg ? (
				<CalendarPreview svg={svg} />
			) : (
				<Card>
					<div style={{ textAlign: 'center', padding: '32px 12px', color: 'var(--text-muted)' }}>
						<Icon name="calendar-days" size={40} style={{ color: 'var(--zinc-300)' }} />
						<p style={{ margin: '10px 0 4px', fontSize: 16, color: 'var(--text-body)', fontFamily: 'var(--font-intl-book)' }}>
							Aucune donnée pour {current?.titre}
						</p>
						<p style={{ margin: 0, fontSize: 14 }}>
							Charge le classeur depuis l’Accueil, puis reviens ici. <Chip tone="gold">{current?.onglet}</Chip>
						</p>
					</div>
				</Card>
			)}
		</div>
	);
}
