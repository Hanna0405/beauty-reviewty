'use client';
import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  children: React.ReactNode;
};

export function ButtonWithSpinner({ loading, disabled, children, className = '', ...rest }: Props) {
  const isDisabled = disabled || loading;
  return (
    <button
      aria-busy={loading ? 'true' : 'false'}
      aria-disabled={isDisabled ? 'true' : 'false'}
      disabled={isDisabled}
      className={`btn btn-primary inline-flex items-center gap-2 ${isDisabled ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
      )}
      <span>{children}</span>
    </button>
  );
}

export default ButtonWithSpinner;
