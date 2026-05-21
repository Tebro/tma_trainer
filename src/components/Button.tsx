import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: ButtonProps) {
  const cls = `tma-button tma-button--${variant}${className ? ' ' + className : ''}`;
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
