import { notFound } from 'next/navigation';
import Image from 'next/image';
import { masters } from '../../../data/masters';

type Props = { params: { id: string } };

export default function MasterProfile({ params }: Props) {
  const master = masters.find(m => m.id === params.id);
  if (!master) return notFound();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="relative aspect-square rounded overflow-hidden">
          <Image src={master.photo} alt={master.name} fill className="object-cover" unoptimized />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{master.name}</h1>
          <div className="text-gray-600">{master.city}</div>
          <div className="mt-2">Rating: {master.rating} • {master.priceRange}</div>
          <div className="mt-3">
            <div className="font-semibold">Main services:</div>
            <ul className="list-disc pl-5">
              {master.mainServices.map(s => <li key={s}>{s}</li>)}
            </ul>
          </div>
          <button className="mt-4 px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700">
            Book
          </button>
        </div>
      </div>
    </div>
  );
}