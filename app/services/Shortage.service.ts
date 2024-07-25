import axios, { type CancelTokenSource } from 'axios';

export const SHORTAGE_ROOT = 'https://shortage.global/';
export const SHORTAGE_API_ROOT = 'https://app.shortage.global/api/';

export function getOrganizationAddress({ orgSlug }: { orgSlug: string }) {
  return `${SHORTAGE_ROOT}${orgSlug}/`;
}

export function getShortageProductUrl({
  orgSlug,
  slug,
}: {
  orgSlug: string;
  slug: string;
}) {
  return `${SHORTAGE_ROOT}${orgSlug}/products/${slug}/`;
}

export function fetchAvailableProducts({
  search = '',
  limit = 15,
  offset = 0,
  cancelToken,
}: {
  search?: string;
  limit?: number;
  offset?: number;
  cancelToken?: CancelTokenSource;
}) {
  return axios.get(`${SHORTAGE_API_ROOT}available/products/`, {
    params: { search, limit, offset },
    cancelToken: cancelToken?.token,
  });
}

export function registerPackage(
  orgSlug: string,
  orderDetails,
  authorizationKey: string
) {
  return axios.post(
    `${SHORTAGE_API_ROOT}organizations/${orgSlug}/packages/`,
    orderDetails,
    { headers: { 'Shopify-Authorization': authorizationKey } }
  );
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
