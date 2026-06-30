export const ALL_VALUE = "Todos";

export const buildOptions = (values, allLabel = "Todos") => [
  { value: ALL_VALUE, label: allLabel },
  ...Array.from(new Set(values.filter(Boolean)))
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({ value, label: value })),
];

export const normalizeFilterValue = (value) => value || ALL_VALUE;

export const isAllFilter = (value) => !value || value === ALL_VALUE;

export const buildQueryString = (filters) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (!isAllFilter(value) && value !== "") {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};
