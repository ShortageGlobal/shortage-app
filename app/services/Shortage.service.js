export const SHORTAGE_ROOT = 'https://shortage.global/';
export const SHORTAGE_API_ROOT = 'https://app.shortage.global/api/';
//organizations
export const ORGANISATION = 'serhii-test-nonprofit';

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

export function registerPackage(orderDetails) {  
  // const apiKey = process.env.SHORTAGE_API_KEY;
	// if (!apiKey) return 0 && console.log('SHORTAGE_API_KEY is not set');

  let options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Shopify-Authorization': ''//apiKey
    },
    body: JSON.stringify(orderDetails),
  };
  
  return fetch(`${SHORTAGE_API_ROOT}organizations/${ORGANISATION}/packages/`, options);
}

export async function getOrganization(organizationSlug) {  
  // const apiKey = process.env.SHORTAGE_API_KEY;
	// if (!apiKey) return 0 && console.log('SHORTAGE_API_KEY is not set');

  let options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Shopify-Authorization': '' // apiKey
    }
  };

  try {
    const response = await fetch(`${SHORTAGE_API_ROOT}organizations/${organizationSlug}/instructions/`, options);
    const data = await response.json();  // Convert the response to JSON
    console.log('Response:', data);  // Print the data
    return data[0];
  } catch (error) {
    console.error('Error fetching organization:', error);  // Handle any errors
    return null;
  }
}