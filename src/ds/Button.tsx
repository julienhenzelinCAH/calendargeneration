import { useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from './Icon';

type Variant = 'gold' | 'outline' | 'ciel' | 'neutral' | 'danger';
type Size = 'lg' | 'md' | 'sm';

const VARIANTS: Record<Variant, { base: CSSProperties; hover: CSSProperties }> = {
	gold: {
		base: { background: 'var(--color-gold)', color: '#fff', border: '1px solid transparent' },
		hover: { background: 'var(--color-gold-hover)' },
	},
	outline: {
		base: { background: '#fff', color: 'var(--color-gold)', border: '1px solid var(--color-gold)' },
		hover: { background: 'var(--color-gold)', color: '#fff' },
	},
	ciel: {
		base: { background: '#fff', color: 'var(--color-ciel)', border: '1px solid var(--color-ciel)' },
		hover: { background: 'var(--color-ciel)', color: '#fff' },
	},
	neutral: {
		base: { background: '#fff', color: 'var(--gray-600)', border: '1px solid var(--gray-300)' },
		hover: { background: 'var(--gray-50)' },
	},
	danger: {
		base: { background: 'var(--red-600)', color: '#fff', border: '1px solid transparent' },
		hover: { background: '#b91c1c' },
	},
};

const SIZES: Record<Size, CSSProperties> = {
	lg: { height: 54, padding: '0 32px', fontSize: 16 },
	md: { height: 48, padding: '0 24px', fontSize: 15 },
	sm: { height: 36, padding: '0 12px', fontSize: 14 },
};

export interface ButtonProps {
	variant?: Variant;
	size?: Size;
	loading?: boolean;
	loadingText?: string;
	disabled?: boolean;
	fullWidth?: boolean;
	icon?: string;
	onClick?: () => void;
	children?: ReactNode;
	style?: CSSProperties;
	type?: 'button' | 'submit';
	title?: string;
}

export function Button({
	variant = 'gold',
	size = 'md',
	loading = false,
	loadingText = 'Chargement…',
	disabled = false,
	fullWidth = false,
	icon,
	onClick,
	children,
	style,
	type = 'button',
	title,
}: ButtonProps) {
	const [hover, setHover] = useState(false);
	const v = VARIANTS[variant];
	const s = SIZES[size];
	const isDisabled = disabled || loading;
	return (
		<button
			type={type}
			title={title}
			disabled={isDisabled}
			onClick={onClick}
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 8,
				fontFamily: 'var(--font-intl-book)',
				borderRadius: 'var(--radius-md)',
				cursor: isDisabled ? 'not-allowed' : 'pointer',
				transition: 'background-color 150ms, color 150ms',
				opacity: isDisabled ? 0.5 : 1,
				whiteSpace: 'nowrap',
				width: fullWidth ? '100%' : undefined,
				...s,
				...v.base,
				...(hover && !isDisabled ? v.hover : null),
				...style,
			}}
		>
			{icon && !loading && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
			{loading ? loadingText : children}
		</button>
	);
}
