import axios, { type CancelTokenSource } from 'axios';

export const SHORTAGE_ROOT = import.meta.env.VITE_SHORTAGE_ROOT;
export const SHORTAGE_API_ROOT = import.meta.env.VITE_SHORTAGE_API_ROOT;

export function getShortageOrganizationUrl({ orgSlug }: { orgSlug: string }) {
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
