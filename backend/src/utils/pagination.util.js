import { DEFAULT_PER_PAGE, MAX_PER_PAGE } from '../config/constants.js';

export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, parseInt(query.perPage, 10) || parseInt(query.limit, 10) || DEFAULT_PER_PAGE)
  );
  const skip = (page - 1) * perPage;
  const sort = query.sort || 'createdAt';
  const order = query.order === 'asc' ? 1 : -1;

  return { page, perPage, skip, sort: { [sort]: order } };
}

export function buildSearchFilter(search, fields) {
  if (!search?.trim()) return {};
  const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return { $or: fields.map((f) => ({ [f]: regex })) };
}
