import db from '../db.server';

async function getProduct(id) {
  try {
    console.log('gid://shopify/Product/'+id);
    console.log('gid://shopify/Product/8761240158505');
    const ProductPair = await db.shortageProductPair.findFirst({ where: { productId : 'gid://shopify/Product/'+id } });

    if (!ProductPair) {
      return null;
    }
    return ProductPair;
  } catch (error) {
    return null;
  }
} 

export default getProduct;