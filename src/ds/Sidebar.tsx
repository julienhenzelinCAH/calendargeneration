import { useState, type CSSProperties } from 'react';
import { Icon } from './Icon';
import logoCah from '../assets/logos/Logo_cAH.svg';

export interface NavItemDef {
	key: string;
	label: string;
	icon: string;
}

function NavButton({
	item,
	active,
	onSelect,
}: {
	item: NavItemDef;
	active: boolean;
	onSelect: (k: string) => void;
}) {
	const [hover, setHover] = useState(false);
	const activeStyle: CSSProperties = {
		background: '#fff',
		color: 'var(--color-gold)',
		fontWeight: 600,
		border: '1px solid rgba(228,228,231,0.8)',
		boxShadow: 'var(--shadow-nav-active)',
	};
	return (
		<button
			onClick={() => onSelect(item.key)}
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 10,
				width: '100%',
				padding: '9px 10px',
				borderRadius: 'var(--radius-md)',
				fontSize: 13,
				fontWeight: 500,
				fontFamily: 'var(--font-euclid)',
				textAlign: 'left',
				cursor: 'pointer',
				transition: 'all 300ms',
				whiteSpace: 'nowrap',
				overflow: 'hidden',
				...(active
					? activeStyle
					: {
							background: hover ? 'var(--zinc-100)' : 'transparent',
							color: hover ? 'var(--zinc-900)' : 'var(--zinc-600)',
							border: '1px solid transparent',
						}),
			}}
		>
			<Icon name={item.icon} size={18} strokeWidth={1.5} />
			<span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
		</button>
	);
}

export interface SidebarProps {
	items: NavItemDef[];
	activeKey: string;
	onSelect: (k: string) => void;
	width?: number;
}

export function Sidebar({ items, activeKey, onSelect, width = 216 }: SidebarProps) {
	return (
		<aside
			style={{
				width,
				flexShrink: 0,
				boxSizing: 'border-box',
				background: '#fff',
				borderRight: '1px solid var(--zinc-200)',
				display: 'flex',
				flexDirection: 'column',
				padding: '14px 0',
				height: '100%',
				fontFamily: 'var(--font-euclid)',
			}}
		>
			<div style={{ padding: '0 16px 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
				<img src={logoCah} alt="Logo cAH" style={{ height: 30, width: 'auto' }} />
				<div style={{ lineHeight: 1.1 }}>
					<div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-euclid-medium)', color: 'var(--text-body)' }}>
						Calendriers
					</div>
					<div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Centre André Henzelin</div>
				</div>
			</div>
			<div style={{ height: 1, background: 'var(--zinc-200)', margin: '12px 12px' }} />
			<nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto', padding: '0 12px' }}>
				{items.map((item) => (
					<NavButton key={item.key} item={item} active={item.key === activeKey} onSelect={onSelect} />
				))}
			</nav>
			<div style={{ padding: '10px 16px 0', fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-intl)' }}>
				100 % local · aucune donnée envoyée
			</div>
		</aside>
	);
}
