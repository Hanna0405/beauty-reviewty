import { z } from 'zod';

export const listingFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  about: z.string().optional(),
  city: z.object({
    label: z.string(),
    placeId: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).nullable().refine((val) => val?.label && val.label.trim().length > 0, {
    message: 'City is required',
  }),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  languages: z.array(z.string()).optional(),
  priceFrom: z.number().optional(),
  priceTo: z.number().optional(),
  photos: z.array(z.string()).optional(),
  status: z.enum(['active', 'hidden']).default('active'),
  isPublished: z.boolean().default(false),
});

export type ListingFormData = z.infer<typeof listingFormSchema>;

export const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().optional(),
  city: z.string().min(2, 'City must be at least 2 characters'),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  languages: z.array(z.string()).optional(),
  priceFrom: z.number().optional(),
  priceTo: z.number().optional(),
  photos: z.array(z.string()).optional(),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;

// City object schema for master profile
const City = z.object({
  label: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

// Master profile schema
export const MasterProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  city: City,
  services: z.array(z.string()).min(1, 'At least one service is required'),
  languages: z.array(z.string()).min(1, 'At least one language is required'),
  priceFrom: z.number().optional(),
  priceTo: z.number().optional(),
  about: z.string().max(1000, 'About must be less than 1000 characters').optional(),
});

export type MasterProfileFormData = z.infer<typeof MasterProfileSchema>;
