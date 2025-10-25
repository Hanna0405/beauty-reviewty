import Link from 'next/link';

export function PublicCardTile({ card }: { card: any }) {
  const href = `/reviewty/${card.id}`;
  return (
    <Link href={href} className="block rounded border hover:shadow-sm focus:outline-none focus:ring">
      {/* existing tile content */}
      <div className="p-4">
        <h3 className="font-medium">{card.title ?? card.masterName ?? 'Master'}</h3>
        {card.cityKey && <p className="text-sm text-gray-600">{card.cityKey}</p>}
        {/* Optionally show a small badge "Threaded" if card has any reviews */}
        <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          Threaded
        </span>
      </div>
    </Link>
  );
}
