import { useState } from 'react';
import { Button, Card, Chip, Icon } from '../ds';
import { useStore } from '../store/AppStore';
import { uid } from '../store/storage';
import { ALL_PROGRAMMES } from '../volees.config';
import { FontManager } from '../components/FontManager';
import type { ModuleColor, Programme, SharedSource, VoleeConfig } from '../types';

const PROGS: Programme[] = ALL_PROGRAMMES;

/** Per-volée editor for modules taught jointly with another volée (e.g. AYU reuses MTE's M1/MP). */
function SharedEditor({
	volee,
	volees,
	onChange,
}: {
	volee: VoleeConfig;
	volees: VoleeConfig[];
	onChange: (shared: SharedSource[]) => void;
}) {
	const shared = volee.shared ?? [];
	const [open, setOpen] = useState(shared.length > 0);
	const others = volees.filter((v) => v.id !== volee.id);

	function upd(i: number, patch: Partial<SharedSource>) {
		onChange(shared.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
	}

	return (
		<div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--zinc-200)' }}>
			<button
				onClick={() => setOpen((o) => !o)}
				style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12.5, fontFamily: 'var(--font-intl)', padding: 0 }}
			>
				<Icon name={open ? 'chevron-down' : 'chevron-right'} size={14} />
				Modules partagés {shared.length > 0 && <Chip tone="gold">{shared.length}</Chip>}
			</button>
			{open && (
				<div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
					<p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
						Reprend les dates de certains modules d’une autre volée (mêmes cours suivis ensemble). Modules séparés par
						des virgules, ou vide = tous.
					</p>
					{shared.map((s, i) => (
						<div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 34px', gap: 8, alignItems: 'center' }}>
							<select value={s.sourceId} onChange={(e) => upd(i, { sourceId: e.target.value })} style={smallInput}>
								<option value="">— volée source —</option>
								{others.map((o) => (
									<option key={o.id} value={o.id}>
										{o.titre}
									</option>
								))}
							</select>
							<input
								value={s.modules.join(', ')}
								placeholder="M1, MP (vide = tous)"
								onChange={(e) =>
									upd(i, {
										modules: e.target.value
											.split(/[\s,]+/)
											.map((m) => m.trim().toUpperCase())
											.filter(Boolean),
									})
								}
								style={{ ...smallInput, fontFamily: 'ui-monospace, monospace', fontSize: 12.5 }}
							/>
							<button
								onClick={() => onChange(shared.filter((_, idx) => idx !== i))}
								title="Retirer la source"
								style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--red-600)', display: 'flex', justifyContent: 'center' }}
							>
								<Icon name="trash" size={16} />
							</button>
						</div>
					))}
					<div>
						<Button size="sm" variant="neutral" icon="plus" onClick={() => onChange([...shared, { sourceId: others[0]?.id ?? '', modules: [] }])}>
							Ajouter une source
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

const smallInput: React.CSSProperties = {
	padding: '7px 9px',
	borderRadius: 'var(--radius-md)',
	border: '1px solid var(--zinc-300)',
	fontSize: 13.5,
	fontFamily: 'var(--font-intl)',
	background: '#fff',
	width: '100%',
	boxSizing: 'border-box',
};

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
			<input
				type="color"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				style={{ width: 30, height: 30, border: '1px solid var(--zinc-300)', borderRadius: 6, background: '#fff', cursor: 'pointer', padding: 2 }}
			/>
			<input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				style={{ ...smallInput, width: 92, fontFamily: 'ui-monospace, monospace', fontSize: 12.5 }}
			/>
		</div>
	);
}

export function Configuration() {
	const store = useStore();
	const { volees, palettes, footers } = store;

	function updVolee(id: string, patch: Partial<VoleeConfig>) {
		store.setVolees(volees.map((v) => (v.id === id ? { ...v, ...patch } : v)));
	}
	function updPalette(prog: Programme, mod: string, patch: Partial<ModuleColor>) {
		store.setPalettes({
			...palettes,
			[prog]: { ...palettes[prog], [mod]: { ...palettes[prog][mod], ...patch } },
		});
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<Card
				title="Volées (mapping onglets ↔ programmes)"
				subtitle="Ajoute une nouvelle année en mappant ses onglets vers ces programmes."
				icon={<Icon name="rectangle-stack" size={22} style={{ color: 'var(--color-gold)' }} />}
				right={
					<Button
						size="sm"
						icon="plus"
						onClick={() =>
							store.setVolees([
								...volees,
								{ id: uid('v'), onglet: '', prog: 'MTE', titre: 'Nouvelle volée', sousTitre: '' },
							])
						}
					>
						Ajouter une volée
					</Button>
				}
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
					{volees.map((v) => (
						<div
							key={v.id}
							style={{ padding: '10px', border: '1px solid var(--zinc-200)', borderRadius: 'var(--radius-md)' }}
						>
							<div style={{ display: 'grid', gridTemplateColumns: '1.4fr 90px 1fr 1.4fr 40px', gap: 8, alignItems: 'center' }}>
								<input value={v.onglet} placeholder="Nom exact de l’onglet" onChange={(e) => updVolee(v.id, { onglet: e.target.value })} style={{ ...smallInput, fontFamily: 'ui-monospace, monospace', fontSize: 12.5 }} />
								<select value={v.prog} onChange={(e) => updVolee(v.id, { prog: e.target.value as Programme })} style={smallInput}>
									{PROGS.map((p) => (
										<option key={p} value={p}>
											{p}
										</option>
									))}
								</select>
								<input value={v.titre} placeholder="Titre" onChange={(e) => updVolee(v.id, { titre: e.target.value })} style={smallInput} />
								<input value={v.sousTitre} placeholder="Sous-titre" onChange={(e) => updVolee(v.id, { sousTitre: e.target.value })} style={smallInput} />
								<button
									onClick={() => store.setVolees(volees.filter((x) => x.id !== v.id))}
									style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--red-600)', display: 'flex', justifyContent: 'center' }}
								>
									<Icon name="trash" size={18} />
								</button>
							</div>
							<SharedEditor volee={v} volees={volees} onChange={(shared) => updVolee(v.id, { shared })} />
						</div>
					))}
				</div>
			</Card>

			<Card
				title="Palettes des modules"
				subtitle="Couleur foncée = numéro · couleur claire = fond de pastille"
				icon={<Icon name="adjustments" size={22} style={{ color: 'var(--color-gold)' }} />}
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
					{PROGS.map((prog) => (
						<div key={prog}>
							<div style={{ fontSize: 14, fontFamily: 'var(--font-intl-book)', fontWeight: 600, marginBottom: 8 }}>{prog}</div>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
								{Object.keys(palettes[prog]).map((mod) => {
									const c = palettes[prog][mod];
									return (
										<div
											key={mod}
											style={{
												display: 'flex',
												flexDirection: 'column',
												gap: 8,
												padding: 12,
												border: '1px solid var(--zinc-200)',
												borderRadius: 'var(--radius-md)',
												minWidth: 190,
											}}
										>
											<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
												<span
													style={{
														display: 'inline-flex',
														alignItems: 'center',
														justifyContent: 'center',
														width: 34,
														height: 26,
														borderRadius: 6,
														background: c.light,
														color: c.dark,
														fontSize: 13,
														fontWeight: 600,
													}}
												>
													12
												</span>
												<span style={{ fontSize: 13.5, fontFamily: 'var(--font-intl-book)', fontWeight: 600 }}>{mod}</span>
											</div>
											<label style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Foncée (numéro)</label>
											<ColorField value={c.dark} onChange={(val) => updPalette(prog, mod, { dark: val })} />
											<label style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Claire (fond)</label>
											<ColorField value={c.light} onChange={(val) => updPalette(prog, mod, { light: val })} />
										</div>
									);
								})}
							</div>
						</div>
					))}
				</div>
			</Card>

			<Card
				title="Pieds de page"
				subtitle="Ligne principale par programme"
				icon={<Icon name="document-text" size={22} style={{ color: 'var(--color-gold)' }} />}
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
					{PROGS.map((prog) => (
						<div key={prog} style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 10, alignItems: 'center' }}>
							<span style={{ fontSize: 13.5, fontFamily: 'var(--font-intl-book)', fontWeight: 600 }}>{prog}</span>
							<input
								value={footers[prog]}
								onChange={(e) => store.setFooters({ ...footers, [prog]: e.target.value })}
								style={smallInput}
							/>
						</div>
					))}
				</div>
			</Card>

			<Card
				title="Polices personnalisées"
				subtitle="Importe tes polices Euclid Flex, Suisse Intl et Poppins (calendrier / PDF)"
				icon={<Icon name="document-text" size={22} style={{ color: 'var(--color-gold)' }} />}
			>
				<FontManager />
			</Card>
		</div>
	);
}
