import Link from "next/link";
import type { RelatedMastersSections as RelatedSections } from "@/lib/seo/loadRelatedMasters";

type Props = RelatedSections & {
  className?: string;
};

function LinkSection({
  title,
  links,
}: {
  title: string;
  links: { id: string; href: string; label: string }[];
}) {
  if (links.length === 0) return null;

  return (
    <section className="mt-8 min-w-0 rounded-xl border bg-white/60 p-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.id} className="min-w-0">
            <Link
              href={link.href}
              prefetch={false}
              className="break-words text-sm text-pink-600 underline underline-offset-2 hover:text-pink-700"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function RelatedMastersSections({
  nearby,
  similarServices,
  className = "",
}: Props) {
  if (nearby.length === 0 && similarServices.length === 0) {
    return null;
  }

  return (
    <div className={`w-full min-w-0 ${className}`.trim()}>
      <LinkSection title="More beauty masters nearby" links={nearby} />
      <LinkSection title="More masters for similar services" links={similarServices} />
    </div>
  );
}
