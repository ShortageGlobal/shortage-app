import db from '../db.server';

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
