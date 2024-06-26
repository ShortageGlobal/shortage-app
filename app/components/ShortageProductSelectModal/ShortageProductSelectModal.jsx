import styles from './ShortageProductSelectModal.module.css';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  VerticalStack,
  ResourceList,
  HorizontalStack,
  Thumbnail,
  Text,
  Link,
  Pagination,
  Checkbox,
  Filters,
  Icon,
  TextField,
} from '@shopify/polaris';
import { SearchMinor } from '@shopify/polaris-icons';
import {
  getProductId,
  getOrganizationAddress,
  getProductAddress,
  fetchAvailableProducts,
} from '~/services/Shortage.service';

const resourceName = { singular: 'product', plural: 'products' };

export function ShortageProductSelectModal({
  open = false,
  onSelect,
  onClose,
}) {
  const [items, setItems] = useState([]);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize /*setPageNumber*/] = useState(15);

  const resetModal = useCallback(() => {
    setItems([]);
    setTotalItemsCount(0);
    setSelectedItem(null);
    setSearchQuery('');
    setIsLoading(false);
    setPageNumber(0);
  }, []);

  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [resetModal, onClose]);

  const handleConfirmSelection = useCallback(() => {
    onClose();
    resetModal();
    onSelect(selectedItem);
  }, [resetModal, onClose, onSelect, selectedItem]);

  // fetch products
  useEffect(() => {
    if (!open) {
      return;
    }
    setIsLoading(true);
    fetchAvailableProducts({
      searchQuery,
      limit: pageSize,
      offset: pageNumber * pageSize,
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.table(data.results);
        setItems(data.results);
        setTotalItemsCount(data.count);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [open, searchQuery, pageNumber, pageSize]);

  const pagination = useMemo(() => {
    const hasPrevious = pageNumber > 0;
    const hasNext = totalItemsCount > pageSize * (pageNumber + 1);
    return (
      <Pagination
        hasPrevious={hasPrevious}
        onPrevious={() => {
          setPageNumber(pageNumber - 1);
        }}
        hasNext={hasNext}
        onNext={() => {
          setPageNumber(pageNumber + 1);
        }}
      />
    );
  }, [pageNumber, pageSize, totalItemsCount]);

  const filterControl = useMemo(() => {
    return (
      <div className={styles.centeredFilter}>
        <div style={{ width: '100%' }}>
          <TextField 
            prefix={<Icon source={SearchMinor} color="base" />} 
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              setPageNumber(0);
            }}
            placeholder="Search Products"
            clearButton
            onClearButtonClick={() => {
              setSearchQuery('');
              setPageNumber(0);
            }}
            label=""
            autoComplete="off"
          />
        </div>
      </div>
    );
  }, [searchQuery]);
  

  const headerContent = useMemo(() => {
    const start = pageNumber * pageSize + 1;
    const end = Math.min((pageNumber + 1) * pageSize, totalItemsCount);
    return `${start}-${end} of ${totalItemsCount}`;
  }, [pageNumber, pageSize, items, totalItemsCount]);

  return (
    <Modal
      instant
      open={open}
      onClose={onClose}
      title='Select Shortage product'
      primaryAction={{
        content: 'Select',
        disabled: !selectedItem,
        onAction: handleConfirmSelection,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: handleClose,
        },
      ]}
    >
      <Modal.Section>
        <VerticalStack>
          <div>
            {filterControl}
          </div>
          <ResourceList
            loading={isLoading}
            resourceName={resourceName}
            items={items}
            alternateTool={pagination}
            headerContent={headerContent}
            renderItem={(item) => {
              const { name, slug, photo, organization } = item;
              const id = getProductId({
                slug,
                orgSlug: organization.slug,
              });
              const productUrl = getProductAddress({
                slug,
                orgSlug: organization.slug,
              });
              const organizationUrl = getOrganizationAddress({
                orgSlug: organization.slug,
              });
              return (
                <div className={styles.listItem}>
                  <HorizontalStack gap='4' wrap={false} blockAlign='center'>
                    <Checkbox
                      label={null}
                      labelHidden
                      checked={selectedItem === item}
                      onChange={() => {
                        setSelectedItem(selectedItem === item ? null : item);
                      }}
                    />
                    <Thumbnail source={photo} alt='Product picture' />
                    <VerticalStack>
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
                    </VerticalStack>
                  </HorizontalStack>
                </div>
              );
            }}
          />
        </VerticalStack>
      </Modal.Section>
    </Modal>
  );
}
