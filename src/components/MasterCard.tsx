import Link from 'next/link';
import Image from 'next/image';

export type Master = {
  id: string;
  name: string;
  city: string;
  photo: string;
  mainServices: string[];
  priceRange: string;
  rating: number;
};

export default function MasterCard({ master }: { master: Master }) {
  return (
    <Link href={`/masters/${master.id}`} className="block border rounded-lg overflow-hidden hover:shadow-md transition">
      <div className="relative h-48">
        <Image src={master.photo} alt={master.name} fill className="object-cover" unoptimized />
      </div>
      <div className="p-3">
        <div className="font-semibold">{master.name}</div>
        <div className="text-sm text-gray-600">{master.city}</div>
        <div className="text-sm mt-1">{master.mainServices.slice(0,3).join(' • ')}</div>
        <div className="text-sm mt-1">Rating: {master.rating} • {master.priceRange}</div>
      </div>
    </Link>
  );
}