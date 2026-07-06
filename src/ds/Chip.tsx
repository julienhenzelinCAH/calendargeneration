import { type CSSProperties, type ReactNode } from 'react';
import { Icon } from './Icon';

type Tone = 'blue' | 'emerald' | 'indigo' | 'violet' | 'zinc' | 'gold' | 'red';

const TONES: Record<Tone, { bg: string; color: string; border: string }> = {
	blue: { bg: 'rgba(239,246,255,0.6)', color: 'var(--blue-700)', border: 'var(--blue-100)' },
	emerald: { bg: 'rgba(236,253,245,0.6)', color: 'var(--emerald-700)', border: 'var(--emerald-100)' },
	indigo: { bg: 'rgba(238,242,255,0.6)', color: 'var(--indigo-700)', border: 'var(--indigo-100)' },
	violet: { bg: 'rgba(245,243,255,0.6)', color: 'var(--violet-700)', border: 'var(--violet-100)' },
	zinc: { bg: 'var(--zinc-50)', color: 'var(--zinc-600)', border: 'var(--zinc-200)' },
	gold: { bg: 'rgba(202,158,103,0.08)', color: 'var(--color-gold-hover)', border: 'rgba(202,158,103,0.3)' },
	red: { bg: 'var(--red-50)', color: 'var(--red-600)', border: 'var(--red-200)' },
};

export interface ChipProps {
	tone?: Tone;
	icon?: string;
	children: ReactNode;
	pill?: boolean;
	style?: CSSProperties;
}

export function Chip({ tone = 'zinc', icon, children, pill = false, style }: ChipProps) {
	const t = TONES[tone];
	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 6,
				padding: '4px 8px',
				borderRadius: pill ? 'var(--radius-full)' : 'var(--radius-sm)',
				fontSize: 12,
				fontWeight: 500,
				fontFamily: 'var(--font-intl)',
				background: t.bg,
				color: t.color,
				border: `1px solid ${t.border}`,
				whiteSpace: 'nowrap',
				...style,
			}}
		>
			{icon && <Icon name={icon} size={14} />}
			{children}
		</span>
	);
}
