export default function CartLoading() {
  return (
    <div className="mx-auto max-w-site px-4 py-10 sm:px-6">
      <div className="skeleton mb-8 h-8 w-48" />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="card space-y-4 p-5">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton h-20 w-20" />
              <div className="flex-1 space-y-2 py-1">
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
        <div className="card h-64 p-6">
          <div className="skeleton h-5 w-32" />
          <div className="mt-5 space-y-3">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
