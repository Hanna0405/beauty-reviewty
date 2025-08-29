'use client';

export type SearchFiltersValue = {
 q: string;
 city: string;
 service: string;
 price: "all" | "4.4" | "4.5" | "5";
};

type Props = {
 value: SearchFiltersValue;
 onChange: (value: SearchFiltersValue) => void;
 className?: string;
};

export default function SearchFilters({ value, onChange, className }: Props) {
 const update = (key: keyof SearchFiltersValue) => 
 (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
 onChange({ ...value, [key]: e.target.value });
 };

 return (
 <div className={`space-y-4 ${className}`}>
   {/* Search Input */}
   <div>
     <label className="block text-sm font-medium text-gray-700 mb-1">
       Search
     </label>
     <input
       type="text"
       value={value.q}
       onChange={update("q")}
       placeholder="Search by name, city, or service..."
       className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
     />
   </div>

   {/* City Filter */}
   <div>
     <label className="block text-sm font-medium text-gray-700 mb-1">
       City
     </label>
     <input
       type="text"
       value={value.city}
       onChange={update("city")}
       placeholder="Enter city name..."
       className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
     />
   </div>

   {/* Service Filter */}
   <div>
     <label className="block text-sm font-medium text-gray-700 mb-1">
       Service
     </label>
     <input
       type="text"
       value={value.service}
       onChange={update("service")}
       placeholder="Enter service name..."
       className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
     />
   </div>

   {/* Rating Filter */}
   <div>
     <label className="block text-sm font-medium text-gray-700 mb-1">
       Minimum Rating
     </label>
     <select
       value={value.price ?? "all"}
       onChange={update("price")}
       className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
     >
       <option value="all">All Ratings</option>
       <option value="4.4">4.4+ Stars</option>
       <option value="4.5">4.5+ Stars</option>
       <option value="5">5.0 Stars</option>
     </select>
   </div>
 </div>
 );
}