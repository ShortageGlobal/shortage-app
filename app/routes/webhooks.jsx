import { authenticate } from '../shopify.server';
import db from '../db.server';

import { handleOrderCreation } from '../services/orderService.server';

export const action = async ({ request }) => {
  const { topic, shop, session, payload } = await authenticate.webhook(request);

  switch (topic) {
    case 'PRODUCTS_UPDATE':
      console.log('\n\n\nPRODUCTS_UPDATE\n\n\n');
      break;
    case "CHECKOUTS_CREATE":
      console.log('\n\n HECKOUTS_CREATE\n\n\n', payload);
      if (session) {
        await handleOrderCreation(payload, shop, session.accessToken);
      }
      break;
    case 'ORDERS_CREATE':
      console.log('');
      console.log('');
      console.log('\n\n\nORDERS_CREATE\n\n\n', payload);
      if (session) {
        await handleOrderCreation(payload, shop, session.accessToken);
      }
      break;
    case 'APP_UNINSTALLED':
      if (session) {
        await db.session.deleteMany({ where: { shop } });
      }
      break;
    case 'CUSTOMERS_DATA_REQUEST':
    case 'CUSTOMERS_REDACT':
    case 'SHOP_REDACT':
    default:
      throw new Response('Unhandled webhook topic', { status: 404 });
  }

  throw new Response();
};
