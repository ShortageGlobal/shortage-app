import type { LoaderFunctionArgs } from '@remix-run/node';
import { getOrganizationDeliveryInstructions } from '~/services/Shortage.server';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const organizationSlug = params.organizationSlug;

  // Set CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
  });

  if (!organizationSlug) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'organizationSlug is required',
      }),
      { status: 400, headers }
    );
  }

  const deliveryInstructions =
    await getOrganizationDeliveryInstructions(organizationSlug);

  return new Response(
    JSON.stringify({
      success: true,
      exists: !!deliveryInstructions,
      organization: deliveryInstructions,
    }),
    { status: 200, headers: headers }
  );
};
