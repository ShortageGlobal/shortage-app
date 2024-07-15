export const SHORTAGE_ROOT = 'https://shortage.global/';
export const SHORTAGE_API_ROOT = 'https://app.shortage.global/api/';

export function getProductId({ slug, orgSlug }) {
  return `${slug}-${orgSlug}`;
}

export function getOrganizationAddress({ orgSlug }) {
  return `${SHORTAGE_ROOT}${orgSlug}/`;
}

export function getShortageProductUrl({ slug, orgSlug }) {
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

export function registerPackage(
  organizationSlug,
  orderDetails,
  authorizationKey
) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Shopify-Authorization': authorizationKey, //apiKey
    },
    body: JSON.stringify(orderDetails),
  };

  return fetch(
    `${SHORTAGE_API_ROOT}organizations/${organizationSlug}/packages/`,
    options
  );
}

export async function getOrganization(organizationSlug) {
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await fetch(
      `${SHORTAGE_API_ROOT}organizations/${organizationSlug}/instructions/`,
      options
    );
    const data = await response.json(); // Convert the response to JSON
    return data[0];
  } catch (error) {
    console.error('Error fetching organization:', error); // Handle any errors
    return null;
  }
}
