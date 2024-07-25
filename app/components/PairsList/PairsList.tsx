import styles from './PairsList.module.css';
import { useNavigate } from '@remix-run/react';
import { AlertDiamondIcon, ImageIcon } from '@shopify/polaris-icons';
import {
  Card,
  EmptyState,
  IndexTable,
  Thumbnail,
  Text,
  Icon,
  InlineStack,
  Link,
} from '@shopify/polaris';

export function PairsList({ pairs }: { pairs: any[] }) {
  const navigate = useNavigate();

  return (
    <Card padding='0'>
      {pairs.length === 0 ? (
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
      ) : (
        <IndexTable
          resourceName={{
            singular: 'Product pair',
            plural: 'Product pairs',
          }}
          itemCount={pairs.length}
          headings={[
            { title: 'Your product' },
            { title: 'Shortage request' },
            { title: 'Date created' },
          ]}
          selectable={false}
        >
          {pairs.map((pair) => {
            return (
              <IndexTable.Row id={pair.id} key={pair.id} position={pair.id}>
                <IndexTable.Cell className={styles.productCell}>
                  <InlineStack gap='300' blockAlign='center' wrap={false}>
                    <div className={styles.thumbnailWrapper}>
                      <Thumbnail
                        source={pair.productImage || ImageIcon}
                        alt='product image or placeholder'
                        size='small'
                      />
                    </div>

                    {pair.productDeleted ? (
                      <InlineStack align='start' gap='200'>
                        <span className={styles.deletedProductAlertItem}>
                          <Icon source={AlertDiamondIcon} tone='critical' />
                        </span>
                        <Text tone='critical' as='span'>
                          product has been deleted
                        </Text>
                      </InlineStack>
                    ) : (
                      <Link url={`pairs/${pair.id}`} monochrome dataPrimaryLink>
                        <Text as='span' fontWeight='bold' breakWord>
                          <span className={styles.normalWhiteSpace}>
                            {pair.productTitle}
                          </span>
                        </Text>
                      </Link>
                    )}
                  </InlineStack>
                </IndexTable.Cell>

                <IndexTable.Cell className={styles.shortageProductCell}>
                  <InlineStack gap='300' blockAlign='center' wrap={false}>
                    <div className={styles.thumbnailWrapper}>
                      <Thumbnail
                        source={pair.shortageProductImage || ImageIcon}
                        alt='product image or placeholder'
                        size='small'
                      />
                    </div>

                    <Text as='span' breakWord>
                      <span className={styles.normalWhiteSpace}>
                        {pair.shortageProductName}
                      </span>
                    </Text>
                  </InlineStack>
                </IndexTable.Cell>

                <IndexTable.Cell>
                  {new Date(pair.createdAt).toLocaleString()}
                </IndexTable.Cell>
              </IndexTable.Row>
            );
          })}
        </IndexTable>
      )}
    </Card>
  );
}
