import Image from 'next/image';
import { normalizeImageUrl } from '@/lib/normalizeImageUrl';
import { useMemo } from 'react';

type Props = { user: any; size?: number; className?: string };
export default function ProfileAvatar({ user, size = 64, className }: Props) {
  // Supports both new field (avatarUrl) and classic Firebase user.photoURL
  const raw = user?.avatarUrl ?? user?.photoURL ?? user?.avatar ?? null;
  const url = normalizeImageUrl(raw);
  const initials = useMemo(() => {
    const raw = user?.displayName ?? user?.name ?? '';
    const name = String(raw).trim();
    if (!name) return 'BR';
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((s: string) => s?.[0] ?? '')
      .join('')
      .toUpperCase() || 'BR';
  }, [user]);

  // cache-busting key: changes when avatarUpdatedAt changes (or when url changes)
  const kb = (user?.avatarUpdatedAt?.seconds || user?.avatarUpdatedAt) ?? url ?? 'no-avatar';

  return url ? (
    <Image
      key={kb}
      src={url}
      alt={user?.displayName || 'avatar'}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className || ''}`}
      unoptimized
    />
  ) : (
    <div
      className={`rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-medium ${className || ''}`}
      style={{ width: size, height: size }}
      aria-label="avatar placeholder"
    >
      {initials}
    </div>
  );
}