import type { LoaderFunctionArgs } from '@remix-run/node';
import { authenticate } from '~/shopify.server';
import { fetchAvailableProducts } from '~/services/Shortage.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const limit = searchParams.get('limit') || 15;
  const offset = searchParams.get('offset') || 0;

  const response = await fetchAvailableProducts({ search, limit, offset });
  return response.data;
};
