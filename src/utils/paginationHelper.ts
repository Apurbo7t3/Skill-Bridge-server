interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export const getPaginationAndSort = (query: any): PaginationOptions => {
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const sortBy = (query.sortBy as string) || "createdAt";
  const sortOrder = (query.sortOrder as string) === "asc" ? "asc" : "desc";
  return { page, limit, skip, sortBy, sortOrder };
};
