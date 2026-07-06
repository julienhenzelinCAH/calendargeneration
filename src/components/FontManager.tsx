import { useMemo, useRef, useState } from 'react';
import { Button, Chip, Icon } from '../ds';
import {
	FONT_SLOTS,
	arrayBufferToBase64,
	loadedFontKeys,
	removeCustomFont,
	setCustomFont,
	type FontSlot,
} from '../store/fonts';

const GROUPS: FontSlot['group'][] = ['Euclid Flex', 'Suisse Intl', 'Poppins (calendrier)'];

export function FontManager() {
	const [version, setVersion] = useState(0);
	const [warning, setWarning] = useState<string | null>(null);
	const inputs = useRef<Record<string, HTMLInputElement | null>>({});
	const loaded = useMemo(() => loadedFontKeys(), [version]);

	async function onFile(slot: FontSlot, file: File | undefined) {
		if (!file) return;
		const buf = await file.arrayBuffer();
		const b64 = arrayBufferToBase64(buf);
		const ok = setCustomFont(slot.key, b64);
		if (!ok)
			setWarning(
				'Police appliquée pour cette session, mais non mémorisée (espace de stockage local saturé). Réduis le nombre de polices personnalisées.',
			);
		else setWarning(null);
		setVersion((v) => v + 1);
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
			<p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>
				Importe tes fichiers de police (<code>.woff2</code>, <code>.woff</code>, <code>.ttf</code>, <code>.otf</code>). Ils
				sont mémorisés localement et appliqués à l’interface, à l’aperçu et — pour Poppins — au PDF vectoriel.
			</p>
			{warning && (
				<div
					style={{
						padding: '10px 12px',
						borderRadius: 'var(--radius-md)',
						background: 'var(--orange-50)',
						border: '1px solid #fed7aa',
						color: 'var(--orange-600)',
						fontSize: 13,
					}}
				>
					{warning}
				</div>
			)}
			{GROUPS.map((group) => (
				<div key={group}>
					<div style={{ fontSize: 14, fontFamily: 'var(--font-intl-book)', fontWeight: 600, marginBottom: 8 }}>{group}</div>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
						{FONT_SLOTS.filter((s) => s.group === group).map((slot) => {
							const isLoaded = loaded.has(slot.key);
							return (
								<div
									key={slot.key}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 10,
										padding: '10px 12px',
										border: '1px solid var(--zinc-200)',
										borderRadius: 'var(--radius-md)',
										minWidth: 210,
									}}
								>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ fontSize: 13.5, fontFamily: 'var(--font-intl-book)' }}>{slot.label}</div>
										<div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
											{slot.family} · {slot.weight}
										</div>
									</div>
									{isLoaded ? (
										<Chip tone="emerald" icon="check-circle">
											Perso
										</Chip>
									) : (
										<Chip tone="zinc">Défaut</Chip>
									)}
									<input
										ref={(el) => {
											inputs.current[slot.key] = el;
										}}
										type="file"
										accept=".woff2,.woff,.ttf,.otf,font/*"
										style={{ display: 'none' }}
										onChange={(e) => onFile(slot, e.target.files?.[0])}
									/>
									<button
										onClick={() => inputs.current[slot.key]?.click()}
										title="Importer une police"
										style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-gold)', display: 'flex', padding: 4 }}
									>
										<Icon name="arrow-down-tray" size={18} />
									</button>
									{isLoaded && (
										<button
											onClick={() => {
												removeCustomFont(slot.key);
												setVersion((v) => v + 1);
											}}
											title="Retirer"
											style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}
										>
											<Icon name="trash" size={16} />
										</button>
									)}
								</div>
							);
						})}
					</div>
				</div>
			))}
			<p style={{ margin: 0, fontSize: 12, color: 'var(--text-faint)' }}>
				Astuce : recharge la page après l’import pour que l’interface reprenne partout la police personnalisée.
			</p>
		</div>
	);
}
