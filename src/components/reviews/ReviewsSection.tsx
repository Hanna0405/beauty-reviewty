// Небольшой обёрточный компонент, чтобы разместить карусель сразу под BannerExtrasClient
import dynamic from 'next/dynamic';

const ReviewsCarousel = dynamic(() => import('./ReviewsCarousel'), { ssr: false });

export default function ReviewsSection() {
  return (
    <div className="mt-2">
      <ReviewsCarousel />
    </div>
  );
}
