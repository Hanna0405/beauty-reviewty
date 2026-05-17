import type { Metadata } from 'next';

export const metadata: Metadata = {
title: 'Masters — BeautyReviewty',
description: 'Browse beauty masters with photos, services and reviews',
};

export default function MastersLayout({
children,
}: {
children: React.ReactNode;
}) {
// Шрифты и globals.css уже подключены в корневом app/layout.tsx,
// поэтому здесь просто оборачиваем страницы раздела в контейнер.
return (
  <section className="container-page w-full max-w-full min-w-0 overflow-x-hidden">
    {children}
  </section>
);
}
