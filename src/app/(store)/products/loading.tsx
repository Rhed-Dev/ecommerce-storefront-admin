import { PageHeaderSkeleton, ProductGridSkeleton } from "@/components/ui/skeletons";

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-site space-y-8 px-4 py-10 sm:px-6">
      <PageHeaderSkeleton />
      <div className="skeleton h-20 w-full" />
      <ProductGridSkeleton count={8} />
    </div>
  );
}
