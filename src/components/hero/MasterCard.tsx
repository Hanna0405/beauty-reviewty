"use client";
import Image from "next/image";

export type MasterCardProps = {
  name: string;
  city: string;
  service: string;
  rating: number; // 0..5
  photoUrl?: string | null;
};

export default function MasterCard({ name, city, service, rating, photoUrl }: MasterCardProps) {
  const stars = "★★★★★".split("").map((s, i) => (
    <span key={i} className={i < rating ? "text-rose-600" : "text-rose-200"}>★</span>
  ));

  return (
    <div className="group rounded-2xl border border-rose-100 bg-white shadow-sm motion-safe:hover:shadow-md motion-safe:hover:-translate-y-0.5 transition-transform transition-shadow duration-200 ease-out overflow-hidden">
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-rose-50">
        {photoUrl ? (
          <Image 
            src={photoUrl} 
            alt={name} 
            fill 
            className="object-cover motion-safe:group-hover:scale-[1.03] transition-transform duration-300 ease-out" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-rose-100">
            <span className="text-rose-600/70 font-semibold">Photo</span>
          </div>
        )}
      </div>

      <div className="p-3 md:p-4">
        <h3 className="text-sm md:text-base font-semibold text-rose-900 line-clamp-1">{name}</h3>
        <p className="text-xs md:text-sm text-rose-700/80 line-clamp-2">{city} · {service}</p>
        <div className="mt-2 text-xs md:text-sm">{stars}</div>
      </div>
    </div>
  );
}
