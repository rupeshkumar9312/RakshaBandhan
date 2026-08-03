export default function Loading() {
  return (
    <div className="container-x py-12">
      <div className="skeleton h-10 w-64 rounded-lg" />
      <div className="skeleton mt-3 h-5 w-96 max-w-full rounded-lg" />

      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="skeleton aspect-4/5" />
            <div className="space-y-2 p-4">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-5 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
