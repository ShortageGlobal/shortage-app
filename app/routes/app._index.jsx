import { json } from '@remix-run/node';
import { useLoaderData, Link, useNavigate } from '@remix-run/react';
import { authenticate } from '../shopify.server';
import {
  Card,
  EmptyState,
  Layout,
  Page,
  IndexTable,
  Thumbnail,
  Text,
  Icon,
  HorizontalStack,
} from '@shopify/polaris';

import { getProductPairs } from '../models/ProductPair.server';
import { DiamondAlertMajor, ImageMajor } from '@shopify/polaris-icons';

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const ProductPairs = await getProductPairs(session.shop, admin.graphql);

  return json({
    ProductPairs,
  });
}

export default function Index() {
  const { ProductPairs } = useLoaderData();
  const navigate = useNavigate();

  function truncate(str) {
    if (!str) return;
    const n = 25;
    return str.length > n ? str.substr(0, n - 1) + '…' : str;
  }

  const emptyMarkup = ProductPairs.length ? null : (
    <EmptyState
      heading='Pair your products with Shortage'
      action={{
        content: 'Create pair',
        onAction: () => navigate('pairs/new'),
      }}
      image='https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png'
    >
      <p>Allow customers to buy products for charity.</p>
    </EmptyState>
  );

  const productPairsMarkup = ProductPairs.length ? (
    <IndexTable
      resourceName={{
        singular: 'Product pair',
        plural: 'Product pairs',
      }}
      itemCount={ProductPairs.length}
      headings={[
        { title: 'Your product' },
        { title: 'Shortage request' },
        { title: 'Date created' },
      ]}
      selectable={false}
    >
      {ProductPairs.map(
        ({
          id,
          productImage,
          productTitle,
          productDeleted,
          shortageProductName,
          shortageProductImage,
          createdAt,
        }) => {
          return (
            <IndexTable.Row id={id} key={id} position={id}>
              <IndexTable.Cell>
                <HorizontalStack gap='2' blockAlign='center'>
                  <Thumbnail
                    source={productImage || ImageMajor}
                    alt={'product image or placeholder'}
                    size='small'
                  />
                  {productDeleted ? (
                    <HorizontalStack align='start' gap={'1'}>
                      <span style={{ width: '20px' }}>
                        <Icon source={DiamondAlertMajor} color='critical' />
                      </span>
                      <Text color={'critical'} as='span'>
                        product has been deleted
                      </Text>
                    </HorizontalStack>
                  ) : (
                    <Link to={`pairs/${id}`}>{truncate(productTitle)}</Link>
                  )}
                </HorizontalStack>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <HorizontalStack gap='2' blockAlign='center'>
                  <Thumbnail
                    source={shortageProductImage || ImageMajor}
                    alt={'product image or placeholder'}
                    size='small'
                  />
                  {truncate(shortageProductName)}
                </HorizontalStack>
              </IndexTable.Cell>

              <IndexTable.Cell>
                {new Date(createdAt).toLocaleString()}
              </IndexTable.Cell>
            </IndexTable.Row>
          );
        }
      )}
    </IndexTable>
  ) : null;

  return (
    <Page>
      <ui-title-bar title='Product Pairs'>
        <button variant='primary' onClick={() => navigate('/app/pairs/new')}>
          Create pair
        </button>
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <Card padding={'0'}>
            {emptyMarkup}
            {productPairsMarkup}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
