import fetch from 'node-fetch';
require('dotenv').config();

export async function handleOrderCreation(order, shop, accessToken) {
	const hasDonation = order.line_items.some(item =>
		item.properties && item.properties.some(prop => prop.name === 'For Donation' && prop.value === 'Yes')
	);	
	if (hasDonation) {
		await addOrderNote(shop, order.id, "This order contains items for donation. Please handle accordingly.", accessToken);
	}
}

export async function addOrderNote(shop, orderId, note, accessToken) {
	console.log('addOrderNote');
	let SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ? process.env.SHOPIFY_API_VERSION : '2023-01';
	const url = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/orders/${orderId}.json`;
	const response = await fetch(url, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			'X-Shopify-Access-Token': accessToken,
		},
		body: JSON.stringify({
			order: {
				id: orderId,
				note: note
			}
		})
	});
	
	const data = await response.json();
	if (!response.ok) {
		console.error('Failed to update order:', data);
		throw new Error('Failed to update order');
	}
}
