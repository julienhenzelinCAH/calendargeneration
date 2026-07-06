import { type CSSProperties, type ChangeEvent, type ReactNode } from 'react';

export interface CheckboxProps {
	checked: boolean;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	label?: ReactNode;
	disabled?: boolean;
	style?: CSSProperties;
}

/* "checkbox-gold" from the product CSS */
export function Checkbox({ checked, onChange, label, disabled, style }: CheckboxProps) {
	return (
		<label
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 8,
				cursor: disabled ? 'not-allowed' : 'pointer',
				fontFamily: 'var(--font-intl)',
				fontSize: 14,
				opacity: disabled ? 0.5 : 1,
				...style,
			}}
		>
			<span style={{ position: 'relative', width: 16, height: 16, flexShrink: 0, display: 'inline-block' }}>
				<input
					type="checkbox"
					checked={checked}
					onChange={onChange}
					disabled={disabled}
					style={{ position: 'absolute', inset: 0, opacity: 0, margin: 0, cursor: 'inherit' }}
				/>
				<span
					style={{
						position: 'absolute',
						inset: 0,
						border: checked ? '1.5px solid var(--color-gold)' : '1.5px solid var(--gray-300)',
						borderRadius: 3,
						background: checked ? 'var(--color-gold)' : '#fff',
						boxSizing: 'border-box',
						transition: 'background-color 150ms, border-color 150ms',
					}}
				/>
				{checked && (
					<span
						style={{
							position: 'absolute',
							left: '50%',
							top: '45%',
							width: '30%',
							height: '55%',
							border: 'solid #fff',
							borderWidth: '0 2px 2px 0',
							transform: 'translate(-50%, -50%) rotate(45deg)',
						}}
					/>
				)}
			</span>
			{label && <span>{label}</span>}
		</label>
	);
}
