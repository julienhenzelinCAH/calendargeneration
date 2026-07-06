import { useState } from 'react';
import { Button, Card, Chip, Icon, Input } from '../ds';
import { useStore } from '../store/AppStore';
import { CsvUpload } from '../components/CsvUpload';
import type { ScreenKey } from '../App';
import type { TabStatus } from '../store/AppStore';

function StatusPill({ status }: { status: TabStatus | undefined }) {
	if (status === 'ok') return <Chip tone="emerald" icon="check-circle">Chargé</Chip>;
	if (status === 'error') return <Chip tone="red" icon="x-circle">Introuvable</Chip>;
	if (status === 'loading') return <Chip tone="gold">…</Chip>;
	return <Chip tone="zinc">Non testé</Chip>;
}

export function Accueil({ goto }: { goto: (s: ScreenKey) => void }) {
	const store = useStore();
	const [showUpload, setShowUpload] = useState(false);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<Card
				title="Classeur Google Sheets"
				subtitle="Colle l’URL ou l’ID du classeur public. Tout est lu directement dans ton navigateur."
				icon={<Icon name="link" size={22} style={{ color: 'var(--color-gold)' }} />}
			>
				<div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
					<Input
						id="sheet"
						label="URL ou ID du classeur"
						value={store.sheetId}
						monospace
						onChange={(e) => store.setSheetId(e.target.value)}
						placeholder="1xs5ITD4Qqz…  ou  https://docs.google.com/spreadsheets/d/…"
						style={{ flex: 1, minWidth: 280 }}
					/>
					<Button icon="arrow-down-tray" loading={store.loading} onClick={store.loadAll}>
						Charger
					</Button>
					<Button variant="outline" icon="link" onClick={store.testConnection}>
						Tester la connexion
					</Button>
				</div>

				<div
					style={{
						marginTop: 16,
						padding: '12px 14px',
						borderRadius: 'var(--radius-md)',
						background: 'var(--color-creme)',
						border: '1px solid rgba(202,158,103,0.25)',
						display: 'flex',
						gap: 10,
						fontSize: 13,
						color: 'var(--text-secondary)',
						fontFamily: 'var(--font-intl)',
					}}
				>
					<Icon name="information-circle" size={18} style={{ color: 'var(--color-gold)', flexShrink: 0, marginTop: 1 }} />
					<span>
						Prérequis&nbsp;: le classeur doit être partagé en «&nbsp;Tout utilisateur disposant du lien&nbsp;: Lecteur&nbsp;».
						La liste des onglets provient de la configuration.
					</span>
				</div>

				{store.loadError && (
					<div
						style={{
							marginTop: 12,
							padding: '12px 14px',
							borderRadius: 'var(--radius-md)',
							background: 'var(--red-50)',
							border: '1px solid var(--red-200)',
							display: 'flex',
							gap: 10,
							fontSize: 13,
							color: 'var(--red-600)',
						}}
					>
						<Icon name="exclamation-triangle" size={18} style={{ flexShrink: 0, marginTop: 1 }} />
						<span>{store.loadError}</span>
					</div>
				)}
			</Card>

			<Card
				title="Onglets configurés"
				subtitle={`${store.volees.length} volées`}
				icon={<Icon name="rectangle-stack" size={22} style={{ color: 'var(--color-gold)' }} />}
				right={
					<Button variant="neutral" size="sm" icon="cog" onClick={() => goto('config')}>
						Gérer
					</Button>
				}
			>
				<ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
					{store.volees.map((v, i) => (
						<li
							key={v.id}
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 12,
								padding: '11px 4px',
								borderTop: i === 0 ? 'none' : '1px solid var(--zinc-100)',
							}}
						>
							<div style={{ minWidth: 0 }}>
								<div style={{ fontSize: 15, fontFamily: 'var(--font-intl-book)', color: 'var(--text-body)' }}>{v.titre}</div>
								<div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace' }}>{v.onglet}</div>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								<Chip tone="gold">{v.prog}</Chip>
								<StatusPill status={store.statuses[v.onglet]} />
							</div>
						</li>
					))}
				</ul>
			</Card>

			<Card
				title="Import manuel (secours)"
				subtitle="Si le fetch est bloqué (CORS ou partage insuffisant), importe les CSV à la main."
				icon={<Icon name="cloud-arrow-up" size={22} style={{ color: 'var(--color-gold)' }} />}
				right={
					<Button variant="neutral" size="sm" onClick={() => setShowUpload((s) => !s)}>
						{showUpload ? 'Masquer' : 'Afficher'}
					</Button>
				}
			>
				{showUpload ? (
					<CsvUpload />
				) : (
					<p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
						Exporte chaque onglet en CSV depuis Google Sheets puis dépose-les ici — le parsing est identique.
					</p>
				)}
			</Card>
		</div>
	);
}
