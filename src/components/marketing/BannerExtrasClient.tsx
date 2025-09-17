'use client';
import SearchBar from '@/components/marketing/SearchBar';
import CategoryChips from '@/components/marketing/CategoryChips';
import MasterCta from '@/components/marketing/MasterCta';

export default function BannerExtrasClient({
  showSearch = true,
  showCategories = true,
  showCta = true,
}: { showSearch?: boolean; showCategories?: boolean; showCta?: boolean }) {
  return (
    <section className="container mx-auto px-4 -mt-2 mb-8 flex flex-col gap-4 md:gap-6">
      {showSearch ? (
        <SearchBar
          onSubmit={(q)=>{
            if (!q) return;
            window.location.href = `/masters?q=${encodeURIComponent(q)}`;
          }}
        />
      ) : null}
      {showCategories ? <CategoryChips /> : null}
      {showCta ? <MasterCta /> : null}
    </section>
  );
}
