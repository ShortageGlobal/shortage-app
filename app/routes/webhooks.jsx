import { authenticate } from '../shopify.server';
import db from '../db.server';
import {
  handleOrderCreation,
  notifyShortage,
} from '../services/orderService.server';

export const action = async ({ request }) => {
  const { topic, shop, session, payload, admin } = await authenticate.webhook(
    request
  );

  switch (topic) {
    case 'PRODUCTS_UPDATE':
      console.log('\nPRODUCTS_UPDATE\n');
      break;
    case 'CHECKOUTS_CREATE':
      console.log('\nCHECKOUTS_CREATE\n');
      break;
    case 'ORDERS_CREATE':
      console.log(`\nORDERS_CREATE\n`);
      if (session) {
        await handleOrderCreation(payload, shop, session.accessToken);

        // TODO: make sure this request doesn't fail.
        // There is no await because Shopify timeouts the webhook if it takes too long.
        // And package creation takes ~7 seconds.
        notifyShortage(payload, admin, session);
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
