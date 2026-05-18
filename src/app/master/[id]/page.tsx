import MasterProfileClient from '@/components/MasterProfileClient';
import RelatedMastersSections from '@/components/seo/RelatedMastersSections';
import { loadRelatedMasterLinks } from '@/lib/seo/loadRelatedMasters';
import { buildMasterJsonLd } from './buildMasterJsonLd';
import { loadMasterProfilePageData } from './loadMasterProfilePageData';
import { loadMasterReviews } from './loadMasterReviews';

export const runtime = 'nodejs'; // ensure not edge
// Next.js 15: params is now a Promise and must be awaited
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const { profile, listings } = await loadMasterProfilePageData(decodedId);
  const reviewMasterId =
    (profile?.uid as string | undefined) ||
    (profile?.userId as string | undefined) ||
    (profile?.ownerId as string | undefined) ||
    (profile?.userUID as string | undefined) ||
    decodedId;
  const [reviews, relatedMasters] = await Promise.all([
    loadMasterReviews(String(reviewMasterId)),
    profile
      ? loadRelatedMasterLinks({ profile, pageId: decodedId })
      : Promise.resolve({ nearby: [], similarServices: [] }),
  ]);

  const jsonLd =
    profile != null
      ? buildMasterJsonLd(decodedId, profile, reviews, listings)
      : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <MasterProfileClient
        id={decodedId}
        initialMaster={profile}
        initialListings={listings}
      />
      <div className="mx-auto max-w-4xl min-w-0 px-4 pb-8">
        <RelatedMastersSections {...relatedMasters} />
      </div>
    </>
  );
}
