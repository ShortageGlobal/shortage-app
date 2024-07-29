import axios from 'axios';

export const SHORTAGE_ROOT = process.env.SHORTAGE_ROOT || '';
export const SHORTAGE_API_ROOT = process.env.SHORTAGE_API_ROOT || '';
export const SHORTAGE_AUTHORIZATION_KEY =
  process.env.SHORTAGE_AUTHORIZATION_KEY || '';

export function fetchAvailableProducts({
  search = '',
  limit = 15,
  offset = 0,
}: {
  search?: string;
  limit?: number | string;
  offset?: number | string;
}) {
  return axios.get(`${SHORTAGE_API_ROOT}available/products/`, {
    params: { search, limit, offset },
  });
}

export async function getOrganizationDeliveryInstructions(orgSlug: string) {
  try {
    const response = await axios.get(
      `${SHORTAGE_API_ROOT}organizations/${orgSlug}/instructions/`
    );
    return response.data[0];
  } catch (error) {
    console.error('Error fetching organization:', error); // Handle any errors
    return null;
  }
}

export function registerPackage(orgSlug: string, orderDetails) {
  return axios.post(
    `${SHORTAGE_API_ROOT}organizations/${orgSlug}/packages/`,
    orderDetails,
    { headers: { 'Shopify-Authorization': SHORTAGE_AUTHORIZATION_KEY } }
  );
}
