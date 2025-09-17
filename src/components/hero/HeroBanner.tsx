"use client";
import { useMemo } from "react";
import MasterCard, { MasterCardProps } from "./MasterCard";
import Link from "next/link";

const SOFT_PINK = "from-rose-100 via-pink-100 to-rose-50";

export default function HeroBanner({ masters }: { masters?: MasterCardProps[] }) {
  // Fallback demo data if none passed
  const items: MasterCardProps[] = useMemo(
    () =>
      masters?.length
        ? masters
        : [
            { name: "Anna K.", city: "Toronto, ON", service: "Hair Stylist", rating: 5 },
            { name: "Maria L.", city: "Vaughan, ON", service: "Nail Artist", rating: 4 },
            { name: "Sofia P.", city: "Barrie, ON", service: "Makeup Artist", rating: 5 },
            { name: "Olga D.", city: "Mississauga, ON", service: "Lash Extensions", rating: 4 },
          ],
    [masters]
  );


  return (
    <section className={`relative overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br ${SOFT_PINK} p-6 md:p-10`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* LEFT: text */}
        <div>
          <h1 className="text-3xl md:text-5xl font-bold text-pink-700 leading-tight -mt-4 md:-mt-8">
            Find your perfect beauty master
          </h1>
          <p className="mt-4 text-zinc-600 text-lg">
            Search by city, services, and language.<br />
            Read real reviews with photos.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/masters" className="inline-flex items-center rounded-xl bg-pink-600 text-white px-5 py-3 font-semibold hover:bg-pink-700 transition">
              Browse Masters
            </Link>
            <Link href="/reviewty" className="inline-flex items-center rounded-xl border border-pink-600 text-pink-700 px-5 py-3 font-semibold hover:bg-pink-50 transition">
              Reviewty
            </Link>
          </div>
        </div>

        {/* RIGHT: responsive grid */}
        <div className="container mx-auto px-4">
          <div className="grid [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] gap-4 md:gap-6">
            {items.map((m, i) => (
              <MasterCard key={`${m.name}-${i}`} {...m} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
