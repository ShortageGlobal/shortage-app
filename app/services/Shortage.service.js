export const SHORTAGE_ROOT = 'https://shortage.global/';
export const SHORTAGE_API_ROOT = 'https://app.shortage.global/api/';

export function getProductId({ slug, orgSlug }) {
  return `${slug}-${orgSlug}`;
}

export function getOrganizationAddress({ orgSlug }) {
  return `${SHORTAGE_ROOT}${orgSlug}/`;
}

export function getProductAddress({ slug, orgSlug }) {
  return `${SHORTAGE_ROOT}${orgSlug}/products/${slug}/`;
}

export function fetchAvailableProducts({
  searchQuery = '',
  limit = 15,
  offset = 0,
}) {
  return fetch(
    `${SHORTAGE_API_ROOT}available/products/?search=${searchQuery}&limit=${limit}&offset=${offset}`,
    { method: 'GET' }
  );
}
