import axios from 'axios';
import { registerPackage } from '~/services/Shortage.server';
import { getAllPairsByIdMap } from '~/models/ProductPair';

export async function handleOrderCreation(order, shop, accessToken) {
  const hasDonation = order.line_items.some(
    (item) =>
      item.properties &&
      item.properties.some(
        (prop) => prop.name === 'For Donation' && prop.value === 'Yes'
      )
  );
  if (hasDonation) {
    await addOrderNote(
      shop,
      order.id,
      'This order contains items for donation. Please handle accordingly.',
      accessToken
    );
  }
}

export async function addOrderNote(shop, orderId, note, accessToken) {
  const url = `https://${shop}/admin/api/2024-07/orders/${orderId}.json`;
  return axios
    .put(
      url,
      { order: { id: orderId, note: note } },
      { headers: { 'X-Shopify-Access-Token': accessToken } }
    )
    .catch((error) => {
      console.error('Failed to update order:', error);
      throw new Error(error);
    });
}

async function getCustomerInfo(order, admin, session) {
  try {
    const r = await admin.rest.resources.Customer.find({
      session: session,
      id: order.customer.id,
      fields: 'id, email, first_name, last_name',
    });
    return r;
  } catch (e) {
    console.log('getCustomerInfo error: ', e);
  }
}

function getDonationsOnly(order) {
  const donationItems = order.line_items.filter(
    (item) =>
      item.properties &&
      item.properties.some(
        (prop) => prop.name === 'For Donation' && prop.value === 'Yes'
      )
  );

  return donationItems;
}

export async function notifyShortage(order, admin, session) {
  const customer = await getCustomerInfo(order, admin, session);

  if (!customer?.email) return 0 && console.log('customer email not found');
  if (!order?.line_items) return 0 && console.log('empty cart');

  const donation_items = getDonationsOnly(order);
  const donation_items_ids = donation_items.map((item) => item.product_id);

  const pairs = await getAllPairsByIdMap(donation_items_ids);

  // Group items by shortageOrganizationSlug
  const groups = donation_items.reduce((acc, item) => {
    const orgSlug = pairs[item.product_id].shortageOrganizationSlug;
    if (!acc[orgSlug]) {
      acc[orgSlug] = [];
    }
    acc[orgSlug].push(item);
    return acc;
  }, {});

  for (const [orgSlug, items] of Object.entries(groups)) {
    const packageDetails = {
      type: 'SHOPIFY_PURCHASE',
      shopify_order_id: order.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone_number: customer.phone ? customer.phone : '',
      need_tax_deduction: true,
      address_line1: order.shipping_address.address1,
      address_line2: order.shipping_address.address2,
      city: order.shipping_address.city,
      state_province_region: order.shipping_address.province,
      zip: order.shipping_address.zip,
      country: order.shipping_address.country_code,
      items: items.map((item) => ({
        product: pairs[item.product_id].shortageProductSlug,
        quantity: item.quantity,
      })),
    };

    /*
    const required_for_tax_deduction_fields = [
      'first_name',
      'last_name',
      'phone_number',
      'address_line1',
      'city',
      'state_province_region',
      'zip',
      'country',
    ];
    */
    const need_tax_deduction = false;

    await registerPackage(orgSlug, {
      ...packageDetails,
      need_tax_deduction,
    });
  }
}
