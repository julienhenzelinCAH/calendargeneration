import { Button, Card, Icon } from '../ds';
import { useStore } from '../store/AppStore';
import { uid } from '../store/storage';
import { ALL_PROGRAMMES } from '../volees.config';
import { FontManager } from '../components/FontManager';
import type { ModuleColor, Programme, VoleeConfig } from '../types';

const PROGS: Programme[] = ALL_PROGRAMMES;

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
							style={{
								display: 'grid',
								gridTemplateColumns: '1.4fr 90px 1fr 1.4fr 40px',
								gap: 8,
								alignItems: 'center',
								padding: '10px',
								border: '1px solid var(--zinc-200)',
								borderRadius: 'var(--radius-md)',
							}}
						>
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
