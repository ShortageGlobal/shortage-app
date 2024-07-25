import type { LoaderFunctionArgs } from '@remix-run/node';
import { getPairByProdId } from '~/models/ProductPair';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const productId = params.productId;

  // Set CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
  });

  if (!productId) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'productId is required',
      }),
      { status: 400, headers }
    );
  }

  const productPair = await getPairByProdId(productId);

  return new Response(
    JSON.stringify({
      success: true,
      exists: !!productPair,
      product: productPair,
    }),
    { status: 200, headers: headers }
  );
};
