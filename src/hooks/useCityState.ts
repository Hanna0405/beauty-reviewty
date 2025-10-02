'use client';
import { useState } from 'react';
import type { CityNorm } from '@/lib/city';

export function useCityState(initial?: CityNorm | null) {
  const [city, setCity] = useState<CityNorm | null>(initial ?? null);
  const cityName = city?.formatted ?? null;
  const cityKey = city?.slug ?? null;
  return { city, setCity, cityName, cityKey };
}
