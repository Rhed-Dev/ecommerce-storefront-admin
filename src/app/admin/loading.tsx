import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-28 w-full" />
        ))}
      </div>
      <TableSkeleton rows={5} />
    </div>
  );
}
