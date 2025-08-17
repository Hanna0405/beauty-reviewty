export interface Master {
  id: string;
  name: string;
  city: string;
  photo: string;
  mainServices: string[];
  priceRange: string;
  rating: number;
  description: string;
  experience: string;
  specialties: string[];
}

export const masters: Master[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    city: 'New York',
    photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
    mainServices: ['Hair Styling', 'Hair Coloring', 'Hair Extensions'],
    priceRange: '$80-$200',
    rating: 4.8,
    description: 'Professional hair stylist with 8 years of experience specializing in modern cuts and vibrant colors.',
    experience: '8 years',
    specialties: ['Balayage', 'Highlights', 'Updos']
  },
  {
    id: '2',
    name: 'Maria Rodriguez',
    city: 'Los Angeles',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    mainServices: ['Makeup Artistry', 'Bridal Makeup', 'Special Effects'],
    priceRange: '$120-$300',
    rating: 4.9,
    description: 'Award-winning makeup artist with expertise in bridal and editorial makeup.',
    experience: '12 years',
    specialties: ['Bridal', 'Editorial', 'Special Effects']
  },
  {
    id: '3',
    name: 'Emily Chen',
    city: 'San Francisco',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
    mainServices: ['Nail Art', 'Gel Manicures', 'Nail Extensions'],
    priceRange: '$50-$150',
    rating: 4.7,
    description: 'Creative nail artist specializing in unique designs and long-lasting gel applications.',
    experience: '6 years',
    specialties: ['3D Nail Art', 'Gel Extensions', 'Nail Art']
  },
  {
    id: '4',
    name: 'Jessica Williams',
    city: 'Chicago',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    mainServices: ['Facial Treatments', 'Skincare', 'Anti-aging'],
    priceRange: '$90-$250',
    rating: 4.6,
    description: 'Licensed esthetician with advanced training in anti-aging and acne treatments.',
    experience: '10 years',
    specialties: ['Chemical Peels', 'Microdermabrasion', 'Anti-aging']
  },
  {
    id: '5',
    name: 'Amanda Davis',
    city: 'Miami',
    photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop&crop=face',
    mainServices: ['Hair Styling', 'Hair Treatments', 'Keratin'],
    priceRange: '$70-$180',
    rating: 4.5,
    description: 'Expert in hair treatments and styling, specializing in keratin and smoothing treatments.',
    experience: '7 years',
    specialties: ['Keratin Treatment', 'Brazilian Blowout', 'Hair Treatments']
  },
  {
    id: '6',
    name: 'Sophie Anderson',
    city: 'Seattle',
    photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face',
    mainServices: ['Makeup Artistry', 'Skincare', 'Beauty Consulting'],
    priceRange: '$100-$280',
    rating: 4.8,
    description: 'Multi-talented beauty professional offering makeup, skincare, and personalized beauty consulting.',
    experience: '9 years',
    specialties: ['Natural Makeup', 'Skincare Routines', 'Beauty Consulting']
  },
  {
    id: '7',
    name: 'Lisa Thompson',
    city: 'Boston',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    mainServices: ['Hair Styling', 'Hair Coloring', 'Hair Cutting'],
    priceRange: '$85-$220',
    rating: 4.7,
    description: 'Master hair stylist with expertise in precision cutting and color correction.',
    experience: '11 years',
    specialties: ['Precision Cutting', 'Color Correction', 'Hair Styling']
  },
  {
    id: '8',
    name: 'Rachel Green',
    city: 'Austin',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
    mainServices: ['Nail Art', 'Gel Manicures', 'Nail Health'],
    priceRange: '$45-$130',
    rating: 4.4,
    description: 'Dedicated nail technician focused on nail health and beautiful, long-lasting manicures.',
    experience: '5 years',
    specialties: ['Nail Health', 'Gel Manicures', 'Nail Art']
  }
];

export const cities = [...new Set(masters.map(master => master.city))];
export const services = [...new Set(masters.flatMap(master => master.mainServices))];
