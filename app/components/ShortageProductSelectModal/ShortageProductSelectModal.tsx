import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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
} from '~/services/Shortage';

const RESOURCE_NAME = { singular: 'product', plural: 'products' };
const resolveItemId = (item) => JSON.stringify(item);

type ShortageProductSelectModalProps = {
  shortageRoot: string;
  onClose: () => void;
  onSelect: (selectedItem: any) => void;
};

export function ShortageProductSelectModal({
  shortageRoot,
  onClose,
  onSelect,
}: ShortageProductSelectModalProps) {
  const fetchProductsAbortController = useRef<AbortController>();

  const [selectedItems, setSelectedItems] = useState<
    ResourceListProps['selectedItems']
  >([]);

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
    const controller = new AbortController();
    fetchProductsAbortController.current?.abort('new request');
    fetchProductsAbortController.current = controller;

    setIsLoading(true);
    fetch(
      `/api/shortage/available-products?` +
        new URLSearchParams({
          search: debouncedSearchQuery,
          limit: `${pageSize}`,
          offset: `${pageNumber * pageSize}`,
        }),
      { signal: controller.signal }
    )
      .then((response) => response.json())
      .then((response) => {
        console.table(response.results);
        setItems(response.results);
        setTotalItemsCount(response.count);
        setIsLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) {
          // do nothing if request has been cancelled
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

          const organizationUrl = getShortageOrganizationUrl({
            shortageRoot,
            orgSlug: organization.slug,
          });

          const productUrl = getShortageProductUrl({
            shortageRoot,
            productSlug: slug,
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
