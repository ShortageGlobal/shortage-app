import { Response } from "@remix-run/node"; // or cloudflare/deno
import {
  getPairByProdId,
} from '../models/ProductPair.server';

export const loader = async ({ request }) => {
  // Set CORS headers
  const headers = new Headers({
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Allow-Credentials': 'true',
		'Content-Type': 'application/json'
	});

  const url = new URL(request.url);
	const productId = url.searchParams.get('prodId');

  if(!productId) {  
    return new Response(JSON.stringify({ success: false, message: 'productId is required' }), {
      status: 400,
      headers: headers
    });
  }

  const productPair = await getPairByProdId(productId);

  return new Response(JSON.stringify({ 
    success: true, 
    exists: !!productPair, 
  }), {
		status: 200,
		headers: headers
	});
};