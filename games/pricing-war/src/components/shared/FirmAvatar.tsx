import { FIRM_COLORS } from '../../types';

interface FirmAvatarProps {
  icon: string;
  name: string;
  index?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function FirmAvatar({ icon, name, index = 0, size = 'md' }: FirmAvatarProps) {
  const color = FIRM_COLORS[index % FIRM_COLORS.length];
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-sm' : size === 'lg' ? 'w-14 h-14 text-2xl' : 'w-10 h-10 text-lg';

  return (
    <div
      className={`${sizeClass} rounded-lg flex items-center justify-center flex-shrink-0`}
      style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
      title={name}
    >
      {icon}
    </div>
  );
}
