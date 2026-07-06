import { useMemo } from 'react';

export function CalendarPreview({ svg, maxWidth = 760 }: { svg: string; maxWidth?: number }) {
	// Make the fixed-size SVG responsive: keep the viewBox, let it scale to the container.
	const responsive = useMemo(
		() =>
			svg
				.replace(/<svg([^>]*?)width="\d+"/, '<svg$1width="100%"')
				.replace(/(<svg[^>]*?)\sheight="\d+"/, '$1 height="auto"')
				.replace('<svg ', '<svg style="display:block;width:100%;height:auto" '),
		[svg],
	);
	return (
		<div
			style={{
				width: '100%',
				maxWidth,
				margin: '0 auto',
				borderRadius: 'var(--radius-lg)',
				overflow: 'hidden',
				boxShadow: 'var(--shadow-menu)',
				border: '1px solid var(--border-card)',
				background: '#fff',
			}}
			// eslint-disable-next-line react/no-danger
			dangerouslySetInnerHTML={{ __html: responsive }}
		/>
	);
}
