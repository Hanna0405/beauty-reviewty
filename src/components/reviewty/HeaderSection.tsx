import type { PublicMasterData } from "@/lib/reviewty";

type Props = {
  master: PublicMasterData;
};

export default function HeaderSection({ master }: Props) {
  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">
        {master.name}
      </h1>

      <div className="flex flex-wrap gap-3 items-center">
        {/* Rating */}
        <div className="flex items-center gap-1">
          <span className="text-yellow-500">
            {"★".repeat(Math.round(master.avgRating))}
          </span>
          <span className="text-sm text-gray-600">
            {master.avgRating.toFixed(1)}
          </span>
        </div>

        {/* Reviews count */}
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
          {master.totalReviews} review{master.totalReviews !== 1 ? "s" : ""}
        </span>

        {/* City */}
        {master.cityName && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            {master.cityName}
          </span>
        )}

        {/* Services */}
        {master.serviceNames && master.serviceNames.length > 0 && (
          <>
            {master.serviceNames.map((service, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-sm"
              >
                {service}
              </span>
            ))}
          </>
        )}

        {/* Languages */}
        {master.languageNames && master.languageNames.length > 0 && (
          <>
            {master.languageNames.map((language, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm"
              >
                {language}
              </span>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
