import { Response } from "@remix-run/node"; // or cloudflare/deno
import {
  getOrganization,
} from '../services/Shortage.service.js';

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
	const organizationSlug = url.searchParams.get('organizationSlug');

  if(!organizationSlug) {  
    return new Response(JSON.stringify({ success: false, message: 'organizationSlug is required' }), {
      status: 400,
      headers: headers
    });
  }

  const organization = await getOrganization(organizationSlug);

  console.log('organization', organization);

  return new Response(JSON.stringify({ 
    success: true, 
    exists: !!organization, 
    organization: organization
  }), {
		status: 200,
		headers: headers
	});
};