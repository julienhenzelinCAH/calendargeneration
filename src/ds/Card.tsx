import { type CSSProperties, type ReactNode } from 'react';

export interface CardProps {
	children: ReactNode;
	style?: CSSProperties;
	padding?: number;
	title?: ReactNode;
	subtitle?: ReactNode;
	right?: ReactNode;
	icon?: ReactNode;
}

export function Card({ children, style, padding = 24, title, subtitle, right, icon }: CardProps) {
	return (
		<section
			style={{
				background: 'var(--surface-card)',
				border: '1px solid var(--border-card)',
				borderRadius: 'var(--radius-lg)',
				boxShadow: 'var(--shadow-card)',
				padding,
				...style,
			}}
		>
			{(title || right) && (
				<header
					style={{
						display: 'flex',
						alignItems: 'flex-start',
						justifyContent: 'space-between',
						gap: 16,
						marginBottom: 16,
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
						{icon}
						<div style={{ minWidth: 0 }}>
							{title && (
								<h2
									style={{
										margin: 0,
										fontSize: 18,
										fontFamily: 'var(--font-intl-book)',
										fontWeight: 600,
										color: 'var(--text-body)',
									}}
								>
									{title}
								</h2>
							)}
							{subtitle && (
								<p style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>{subtitle}</p>
							)}
						</div>
					</div>
					{right}
				</header>
			)}
			{children}
		</section>
	);
}
