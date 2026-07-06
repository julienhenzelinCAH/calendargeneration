import { type CSSProperties, type ChangeEvent, type ReactNode } from 'react';

export interface InputProps {
	label?: ReactNode;
	type?: string;
	value?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	required?: boolean;
	id?: string;
	hint?: ReactNode;
	error?: string;
	style?: CSSProperties;
	monospace?: boolean;
}

export function Input({
	label,
	type = 'text',
	value,
	onChange,
	placeholder,
	required,
	id,
	hint,
	error,
	style,
	monospace,
}: InputProps) {
	return (
		<div style={{ width: '100%', ...style }}>
			{label && (
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
					<label htmlFor={id} style={{ fontSize: 14, fontFamily: 'var(--font-intl-book)', color: 'var(--text-body)' }}>
						{label}
					</label>
					{hint || null}
				</div>
			)}
			<input
				id={id}
				type={type}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				required={required}
				style={{
					width: '100%',
					boxSizing: 'border-box',
					padding: '11px 12px',
					background: '#fff',
					border: '1px solid var(--color-gold)',
					borderRadius: 'var(--radius-md)',
					fontSize: 15,
					fontFamily: monospace ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'var(--font-intl)',
					color: 'var(--text-body)',
					outline: 'none',
				}}
			/>
			{error && <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--red-600)' }}>{error}</p>}
		</div>
	);
}
