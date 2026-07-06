import { type ReactNode } from 'react';

export interface TopbarProps {
	title: ReactNode;
	subtitle?: ReactNode;
	right?: ReactNode;
}

export function Topbar({ title, subtitle, right }: TopbarProps) {
	return (
		<header
			style={{
				minHeight: 64,
				boxSizing: 'border-box',
				background: '#fff',
				borderBottom: '1px solid var(--zinc-200)',
				display: 'flex',
				alignItems: 'center',
				gap: 16,
				padding: '10px 32px',
				fontFamily: 'var(--font-euclid)',
			}}
		>
			<div style={{ minWidth: 0 }}>
				<h1 style={{ margin: 0, fontSize: 21, fontWeight: 600, fontFamily: 'var(--font-euclid-medium)', color: 'var(--text-body)' }}>
					{title}
				</h1>
				{subtitle && <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-intl)' }}>{subtitle}</p>}
			</div>
			<div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>{right}</div>
		</header>
	);
}
