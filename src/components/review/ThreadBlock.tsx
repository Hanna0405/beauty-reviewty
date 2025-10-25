export function ThreadBlock({ card, reviews }: { card: any; reviews: any[] }) {
  return (
    <section data-thread={`pc_${card.id}`} className="space-y-3">
      <ul className="space-y-3">
        {reviews.map((r) => (
          <li key={r.id}>
            {/* Reuse your existing ReviewCard component here */}
            {/* <ReviewCard review={r} /> */}
            {/* If you don't have it centralized, render the same UI you use on /reviewty for a single review */}
            <div className="rounded-lg border p-4 shadow-sm">
              <div className="flex items-start gap-3">
                {/* optional thumbnail */}
                {Array.isArray(r.photos) && r.photos[0] ? (
                  <img
                    src={
                      typeof r.photos[0] === "string"
                        ? r.photos[0]
                        : r.photos[0]?.downloadURL || r.photos[0]?.url
                    }
                    alt=""
                    className="h-16 w-16 rounded object-cover border"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-16 w-16 rounded bg-gray-100 border flex items-center justify-center text-xs">
                    No photo
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                    Review
                  </div>
                  <div className="text-xs mt-0.5 text-gray-600">
                    Rating: {r.rating}★{r.cityKey ? ` · ${r.cityKey}` : ""}
                  </div>
                  {r.text ? (
                    <p className="mt-1 text-sm leading-5 text-gray-800 line-clamp-3">
                      {r.text}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
