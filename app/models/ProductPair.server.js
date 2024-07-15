import db from '../db.server';

export async function getPairByProdId(productId) {
  const productPair = await db.shortageProductPair.findFirst({
    where: { productId: 'gid://shopify/Product/' + productId },
  });

  return productPair;
}

export async function getAllPairsByIdMap(productIds) {
  const productPairs = await getAllPairsByProdIds(productIds);

  // Transform the list of pairs into a map indexed by product ID
  const pairsMap = productPairs.reduce((acc, pair) => {
    const productId = pair.productId.split('/').pop(); // Extract the numeric ID part
    if (productId) acc[productId] = pair;
    return acc;
  }, {});

  return pairsMap;
}

async function getAllPairsByProdIds(productIds) {
  const productGids = productIds.map((id) => 'gid://shopify/Product/' + id);
  const productPairs = await db.shortageProductPair.findMany({
    where: {
      productId: {
        in: productGids,
      },
    },
  });

  return productPairs;
}

export async function getProductPair(id, graphql) {
  const ProductPair = await db.shortageProductPair.findFirst({ where: { id } });

  if (!ProductPair) {
    return null;
  }

  return supplementProductPair(ProductPair, graphql);
}

export async function getProductPairs(shop, graphql) {
  const ProductPairs = await db.shortageProductPair.findMany({
    where: { shop },
    orderBy: { id: 'desc' },
  });

  if (!ProductPairs.length) {
    return ProductPairs;
  }

  return Promise.all(
    ProductPairs.map(async (ProductPair) =>
      supplementProductPair(ProductPair, graphql)
    )
  );
}

async function supplementProductPair(ProductPair, graphql) {
  const response = await graphql(
    `
      query supplementProductPair($id: ID!) {
        product(id: $id) {
          title
          images(first: 1) {
            nodes {
              altText
              url
            }
          }
        }
      }
    `,
    {
      variables: {
        id: ProductPair.productId,
      },
    }
  );

  const {
    data: { product },
  } = await response.json();

  return {
    ...ProductPair,
    productDeleted: !product.title,
    productTitle: product.title,
    productImage: product.images?.nodes[0]?.url,
    productAlt: product.images?.nodes[0]?.altText,
    // destinationUrl: getDestinationUrl(ProductPair),
    // image: await getProductPairImage(ProductPair.id),
  };
}

export function validateProductPair(data) {
  const errors = {};

  if (!data.productId) {
    errors.productId = 'Product is required';
  }

  if (!data.shortageOrganizationId) {
    errors.shortageOrganizationId = 'Shortage organization is required';
  }

  if (!data.shortageProductId) {
    errors.shortageProductId = 'Shortage product is required';
  }

  if (!data.shortageProductName) {
    errors.shortageProductName = 'Shortage product name is required';
  }

  if (!data.shortageProductImage) {
    errors.shortageProductImage = 'Shortage product image is required';
  }

  if (Object.keys(errors).length) {
    return errors;
  }
}
