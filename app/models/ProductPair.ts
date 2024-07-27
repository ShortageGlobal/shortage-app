import db from '~/db.server';

export async function getPairByProdId(productId: string) {
  const productPair = await db.shortageProductPair.findFirst({
    where: {
      productId: 'gid://shopify/Product/' + productId,
      isVerified: true,
    },
  });

  return productPair;
}

export async function getAllPairsByIdMap(productIds: string[]) {
  const productPairs = await getAllPairsByProdIds(productIds);

  // Transform the list of pairs into a map indexed by product ID
  const pairsMap = productPairs.reduce<Record<string, any>>((acc, pair) => {
    const productId = pair.productId.split('/').pop(); // Extract the numeric ID part
    if (productId) {
      acc[productId] = pair;
    }
    return acc;
  }, {});

  return pairsMap;
}

async function getAllPairsByProdIds(productIds: string[]) {
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

export async function getProductPair(id: number, graphql) {
  const ProductPair = await db.shortageProductPair.findFirst({ where: { id } });

  if (!ProductPair) {
    return null;
  }

  return supplementProductPair(ProductPair, graphql);
}

export async function getProductPairs(shop: string, graphql) {
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
  };
}

export async function validateProductPair(data, id: number) {
  const errors = {};

  if (!data.productId) {
    errors.productId = 'Product is required';
  }

  // check if product is already paired with Shortage
  const existingPair = await db.shortageProductPair.findFirst({
    where: { shop: data.shop, productId: data.productId, NOT: { id } },
  });

  if (existingPair) {
    errors.pairExists = { existingPair };
  }

  // validate Shortage request
  if (
    !data.shortageProductSlug ||
    !data.shortageProductName ||
    !data.shortageOrganizationSlug ||
    !data.shortageOrganizationName
  ) {
    errors.shortageProduct = 'Shortage request is required';
  } else if (!data.shortageProductImage) {
    errors.shortageProductImage = 'Shortage product image is required';
  }

  if (Object.keys(errors).length) {
    return errors;
  }
}

export async function createPair(data) {
  return db.shortageProductPair.create({ data });
}

export async function updatePair(id: number, data) {
  return db.shortageProductPair.update({
    where: { id },
    data,
  });
}

export async function deletePair(id: number) {
  await db.shortageProductPair.delete({ where: { id } });
}

export async function deletePairsByShop(shop) {
  await db.shortageProductPair.deleteMany({ where: { shop } });
}
