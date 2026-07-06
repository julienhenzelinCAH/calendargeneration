import { type CSSProperties } from 'react';

export interface LoaderProps {
	color?: string;
	size?: number;
	label?: string;
	overlay?: boolean;
	style?: CSSProperties;
}

export function Loader({ color = 'var(--color-gold)', size = 40, label, overlay = false, style }: LoaderProps) {
	const spinner = (
		<div
			style={{
				width: size,
				height: size,
				borderRadius: '50%',
				border: '2px solid transparent',
				borderTopColor: color,
				borderBottomColor: color,
				animation: 'cah-spin 1s linear infinite',
				...(!overlay ? style : null),
			}}
		/>
	);
	if (!overlay) return spinner;
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				zIndex: 50,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 16,
				background: 'rgba(255,255,255,0.8)',
				backdropFilter: 'blur(4px)',
				...style,
			}}
		>
			{spinner}
			{label && <p style={{ margin: 0, fontSize: 14, color: 'var(--gray-600)', fontFamily: 'var(--font-intl)' }}>{label}</p>}
		</div>
	);
}
