import React from 'react';
import { Stance } from '../types/game';

export interface PebbleProps {
  variant?: number;
  stance?: Stance | 'neutral';
  label?: string;
  shifted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
  onClick?: () => void;
}

export const Pebble: React.FC<PebbleProps> = ({
  variant = 0,
  stance = 'neutral',
  label,
  shifted = false,
  size = 'md',
  className = '',
  title,
  onClick,
}) => {
  const normalizedVariant = Math.abs(Math.floor(variant)) % 5;
  const classes = [
    'pebble',
    `pebble-variant-${normalizedVariant}`,
    `pebble-stance-${stance}`,
    `pebble-size-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const displayLabel = label
    ? label.length > 3 && size === 'sm'
      ? label.slice(0, 2)
      : label
    : '';

  return (
    <div
      className={classes}
      title={title || label}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {shifted && (
        <span
          className="pebble-shift-indicator"
          title="Shifted stance during What If twist"
          aria-label="Shifted stance"
        />
      )}
      {displayLabel && <span className="pebble-label">{displayLabel}</span>}
    </div>
  );
};
