import { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'REVIEWty — народные отзывы о мастерах красоты',
 description: 'Свежие пользовательские отзывы с фото: мастера, салоны, частные специалисты. Фильтры по городу, услугам и рейтингу.',
 robots: { index: true, follow: true },
 openGraph: {
 title: 'REVIEWty — народные отзывы',
 description: 'Фильтры: город, услуги, рейтинг 4+.',
 }
};

export default function ReviewtyLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return children;
}
