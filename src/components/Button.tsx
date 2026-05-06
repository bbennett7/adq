import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant;
}

export function Button({
	variant = 'secondary',
	className,
	...props
}: ButtonProps) {
	const cls = ['btn', `btn-${variant}`, className].filter(Boolean).join(' ');
	return <button type="button" className={cls} {...props} />;
}
