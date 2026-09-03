import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface IconHelperProps {
  name: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const IconHelper: React.FC<IconHelperProps> = ({
  name,
  className = 'w-4 h-4',
  size,
  style,
}) => {
  const iconsRecord = LucideIcons as unknown as Record<string, LucideIcon | undefined>;
  const IconComponent = iconsRecord[name] || LucideIcons.HelpCircle;
  return <IconComponent className={className} size={size} style={style} />;
};
