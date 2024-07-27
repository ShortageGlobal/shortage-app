import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, TitleBar } from '@shopify/app-bridge-react';
import {
  ResourceList,
  ResourceItem,
  Thumbnail,
  Text,
  Link,
  Filters,
  type ResourceListProps,
} from '@shopify/polaris';
import { useDebounce } from 'use-debounce';
import {
  getShortageOrganizationUrl,
  getShortageProductUrl,
  fetchAvailableProducts,
} from '~/services/Shortage.client';
import { useCancelToken, isRequestCancel } from '~/hooks/useCancelToken';

const RESOURCE_NAME = { singular: 'product', plural: 'products' };
const resolveItemId = (item) => JSON.stringify(item);

type ShortageProductSelectModalProps = {
  onClose: () => void;
  onSelect: (selectedItem: any) => void;
};

export function ShortageProductSelectModal({
  onClose,
  onSelect,
}: ShortageProductSelectModalProps) {
  const [selectedItems, setSelectedItems] = useState<
    ResourceListProps['selectedItems']
  >([]);
  const getFetchCancelToken = useCancelToken();

  const [items, setItems] = useState([]);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize /*setPageNumber*/] = useState(15);

  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  const handleConfirmSelection = useCallback(() => {
    if (!selectedItems || selectedItems.length !== 1) {
      return;
    }
    onSelect(JSON.parse(selectedItems[0]));
  }, [selectedItems, onSelect]);

  // fetch products
  useEffect(() => {
    const cancelToken = getFetchCancelToken();

    setIsLoading(true);
    fetchAvailableProducts({
      search: debouncedSearchQuery,
      limit: pageSize,
      offset: pageNumber * pageSize,
      cancelToken,
    })
      .then((response) => {
        console.table(response.data.results);
        setItems(response.data.results);
        setTotalItemsCount(response.data.count);
        setIsLoading(false);
      })
      .catch((rejection) => {
        if (isRequestCancel(rejection)) {
          return;
        }
        setIsLoading(false);
      });
  }, [debouncedSearchQuery, pageNumber, pageSize]);

  const pagination = useMemo(() => {
    if (!totalItemsCount) {
      return;
    }
    const hasPrevious = pageNumber > 0;
    const hasNext = totalItemsCount > pageSize * (pageNumber + 1);

    const start = pageNumber * pageSize + 1;
    const end = Math.min((pageNumber + 1) * pageSize, totalItemsCount);
    const label = `${start}-${end} of ${totalItemsCount}`;

    return {
      label,
      hasPrevious,
      hasNext,
      onPrevious: () => setPageNumber(pageNumber - 1),
      onNext: () => setPageNumber(pageNumber + 1),
    };
  }, [pageNumber, pageSize, totalItemsCount]);

  const filterControl = useMemo(() => {
    return (
      <Filters
        queryPlaceholder='Search products'
        queryValue={searchQuery}
        filters={[]}
        onQueryChange={(value) => {
          setSearchQuery(value);
          setPageNumber(0);
        }}
        onQueryClear={() => {
          setSearchQuery('');
          setPageNumber(0);
        }}
        onClearAll={() => {
          setSearchQuery('');
          setPageNumber(0);
        }}
      />
    );
  }, [searchQuery]);

  return (
    <Modal open onHide={onClose}>
      <TitleBar title='Select Shortage request'>
        <button
          variant='primary'
          disabled={selectedItems && selectedItems.length !== 1}
          onClick={handleConfirmSelection}
        >
          Select
        </button>
        <button onClick={onClose}>Cancel</button>
      </TitleBar>

      <ResourceList
        selectable
        showHeader={false}
        resourceName={RESOURCE_NAME}
        items={items}
        loading={isLoading}
        filterControl={filterControl}
        totalItemsCount={totalItemsCount}
        pagination={pagination}
        selectedItems={selectedItems}
        resolveItemId={resolveItemId}
        onSelectionChange={setSelectedItems}
        renderItem={(item) => {
          const { name, slug, photo, organization } = item;
          const id = resolveItemId(item);

          const productUrl = getShortageProductUrl({
            slug,
            orgSlug: organization.slug,
          });

          const organizationUrl = getShortageOrganizationUrl({
            orgSlug: organization.slug,
          });

          const media = (
            <Thumbnail source={photo} size='small' alt='Product picture' />
          );

          return (
            <ResourceItem
              id={id}
              media={media}
              name={name}
              verticalAlignment='center'
              accessibilityLabel={`Select ${name} from ${organization.name}`}
              disabled={
                selectedItems &&
                selectedItems.length > 0 &&
                !selectedItems.includes(id)
              }
              onClick={() => {
                setSelectedItems([id]);
              }}
            >
              <Text variant='bodyMd' fontWeight='bold' as='h3'>
                <Link
                  url={productUrl}
                  target='_blank'
                  monochrome
                  removeUnderline
                >
                  {name}
                </Link>
              </Text>
              <div>
                requested by{' '}
                <Link
                  url={organizationUrl}
                  target='_blank'
                  monochrome
                  removeUnderline
                >
                  {organization.name}
                </Link>
              </div>
            </ResourceItem>
          );
        }}
      />
    </Modal>
  );
}
