import Link from 'next/link';
import Image from 'next/image';

// Захардкоженные данные для Featured Masters
const featuredMasters = [
  {
    id: '1',
    name: 'Anna Smith',
    specialization: 'Hair Stylist',
    description: 'Professional hair styling with 8+ years of experience. Specializes in modern cuts and color techniques.',
    photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
    city: 'New York'
  },
  {
    id: '2',
    name: 'Maria Rodriguez',
    specialization: 'Makeup Artist',
    description: 'Bridal and special occasion makeup expert. Creating stunning looks for every occasion.',
    photo: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=400&fit=crop&crop=face',
    city: 'Los Angeles'
  },
  {
    id: '3',
    name: 'Sarah Johnson',
    specialization: 'Nail Technician',
    description: 'Creative nail art and professional manicure services. Bringing your nail dreams to life.',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    city: 'Chicago'
  },
  {
    id: '4',
    name: 'Elena Petrov',
    specialization: 'Facial Specialist',
    description: 'Advanced skincare treatments and anti-aging solutions. Your skin health is my priority.',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    city: 'Miami'
  }
];

export default function FeaturedMasters() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Masters</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our top-rated beauty professionals who are ready to make you look and feel amazing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {featuredMasters.map((master) => (
            <div key={master.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative h-48">
                <Image 
                  src={master.photo} 
                  alt={master.name} 
                  fill 
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{master.name}</h3>
                <p className="text-pink-600 font-medium text-sm mb-2">{master.specialization}</p>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{master.description}</p>
                <Link 
                  href={`/masters/${String(master.id)}`}
                  className="inline-block bg-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-700 transition-colors duration-200"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link 
            href="/masters"
            className="inline-block bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-200"
          >
            View All Masters
          </Link>
        </div>
      </div>
    </section>
  );
}
