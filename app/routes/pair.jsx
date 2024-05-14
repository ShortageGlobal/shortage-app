import { Response } from "@remix-run/node"; // or cloudflare/deno

export const loader = async ({ request }) => {
  // Set CORS headers
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Content-Type', 'application/json'); // Ensure JSON content type

  // handle "GET" request
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: headers
  });
};