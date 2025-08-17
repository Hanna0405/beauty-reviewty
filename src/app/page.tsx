import Link from 'next/link';
import Header from '@/components/Header';
import MasterCard from '@/components/MasterCard';
import { masters } from '@/data/masters';

export default function Home() {
  // Get 3 featured masters (highest rated)
  const featuredMasters = masters
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  return (
    <div>
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Your Perfect
              <span className="block text-pink-200">Beauty Master</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-pink-100 max-w-3xl mx-auto">
              Discover talented beauty professionals in your area. From hair styling to makeup artistry, 
              find the perfect expert for your beauty needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/masters"
                className="bg-white text-pink-600 px-8 py-3 rounded-lg font-semibold hover:bg-pink-50 transition-colors duration-200"
              >
                Browse All Masters
              </Link>
              <Link
                href="/masters"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-pink-600 transition-colors duration-200"
              >
                Find by Location
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-pink-600 mb-2">{masters.length}+</div>
              <div className="text-gray-600">Professional Masters</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-pink-600 mb-2">8</div>
              <div className="text-gray-600">Cities Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-pink-600 mb-2">4.7</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Masters Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Beauty Masters
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Meet our top-rated beauty professionals who are ready to help you look and feel your best.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredMasters.map((master) => (
              <MasterCard key={master.id} master={master} />
            ))}
          </div>
          
          <div className="text-center">
            <Link
              href="/masters"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              View All Masters
              <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-lg text-gray-600">
              Comprehensive beauty services offered by our professional masters
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Hair Styling',
                description: 'Professional cuts, coloring, and styling',
                icon: '💇‍♀️'
              },
              {
                title: 'Makeup Artistry',
                description: 'Bridal, special occasion, and everyday makeup',
                icon: '💄'
              },
              {
                title: 'Nail Services',
                description: 'Manicures, pedicures, and nail art',
                icon: '💅'
              },
              {
                title: 'Skincare',
                description: 'Facials, treatments, and consultations',
                icon: '✨'
              }
            ].map((service, index) => (
              <div key={index} className="text-center p-6 bg-gray-50 rounded-lg hover:bg-pink-50 transition-colors duration-200">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Look?
          </h2>
          <p className="text-xl mb-8 text-pink-100">
            Connect with our beauty masters and book your appointment today.
          </p>
          <Link
            href="/masters"
            className="inline-flex items-center px-8 py-3 bg-white text-pink-600 rounded-lg font-semibold hover:bg-pink-50 transition-colors duration-200"
          >
            Find Your Master
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
