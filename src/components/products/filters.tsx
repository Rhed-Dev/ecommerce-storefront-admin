interface FiltersProps {
  categories: Array<{ slug: string; name: string }>;
  search: string;
  category: string;
  sort: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
] as const;

/**
 * Filter bar rendered as a plain GET form — works without JavaScript and
 * keeps the URL shareable (?q=&category=&sort=&page=).
 */
export function ProductFilters({ categories, search, category, sort }: FiltersProps) {
  return (
    <form
      method="get"
      action="/products"
      className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label htmlFor="filter-q" className="label">
          Search
        </label>
        <input
          id="filter-q"
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search products…"
          className="input"
        />
      </div>

      <div className="sm:w-48">
        <label htmlFor="filter-category" className="label">
          Category
        </label>
        <select id="filter-category" name="category" defaultValue={category} className="input">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:w-52">
        <label htmlFor="filter-sort" className="label">
          Sort by
        </label>
        <select id="filter-sort" name="sort" defaultValue={sort} className="input">
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn-primary sm:w-auto">
        Apply
      </button>
    </form>
  );
}
