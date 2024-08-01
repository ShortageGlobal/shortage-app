import type { ActionFunctionArgs } from '@remix-run/node';
import { authenticate } from '~/shopify.server';
import db from '~/db.server';
import { handleOrderCreation, notifyShortage } from '~/services/Orders.server';
import { deletePairsByShop } from '~/models/ProductPair';

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin, payload } =
    await authenticate.webhook(request);

  // if (!admin) {
  //   // The admin context isn't returned if the webhook fired after a shop was uninstalled.
  //   throw new Response();
  // }

  // The topics handled here should be declared in the shopify.app.toml.
  // More info: https://shopify.dev/docs/apps/build/cli-for-apps/app-configuration
  switch (topic) {
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
      console.log(`\nAPP_UNINSTALLED\n`, payload);
      if (session) {
        await db.session.deleteMany({ where: { shop } });
      }
      break;
    case 'CUSTOMERS_DATA_REQUEST':
      console.log(`\nCUSTOMERS_DATA_REQUEST\n`);
      // we do not store customer information in the app
      break;
    case 'CUSTOMERS_REDACT':
      console.log(`\nCUSTOMERS_REDACT\n`);
      // we do not store customer information in the app
      break;
    case 'SHOP_REDACT':
      console.log(`\nSHOP_REDACT\n`);
      await deletePairsByShop(payload.shop_domain);
      break;
    default:
      console.log(`\nUnhandled webhook topic: ${topic}\n`);
      break;
  }

  throw new Response();
};
