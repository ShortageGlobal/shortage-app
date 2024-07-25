import { useState, useEffect } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
  useNavigate,
} from '@remix-run/react';
import { useAppBridge } from '@shopify/app-bridge-react';
import {
  Card,
  Button,
  InlineStack,
  InlineError,
  Layout,
  Page,
  Text,
  Thumbnail,
  BlockStack,
  PageActions,
  Link,
  Banner,
} from '@shopify/polaris';
import { ImageIcon } from '@shopify/polaris-icons';
import { authenticate } from '~/shopify.server';
import { ShortageProductSelectModal } from '~/components/ShortageProductSelectModal/ShortageProductSelectModal';
import {
  getOrganizationAddress,
  getShortageProductUrl,
} from '~/services/Shortage.service';
import {
  getProductPair,
  validateProductPair,
  createPair,
  updatePair,
  deletePair,
} from '~/models/ProductPair';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);

  if (params.id === 'new') {
    return json({
      productId: '',
      productVariantId: '',
      shortageOrganizationSlug: '',
      shortageOrganizationName: '',
      shortageProductSlug: '',
      shortageProductName: '',
      shortageProductImage: '',
    });
  }

  return json(await getProductPair(Number(params.id), admin.graphql));
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  if (request.method === 'DELETE') {
    await deletePair(Number(params.id));
    return redirect('/app');
  }

  const data = {
    ...Object.fromEntries(await request.formData()),
    shop,
  };

  const errors = await validateProductPair(
    data,
    params.id === 'new' ? 0 : Number(params.id)
  );

  if (errors) {
    return json({ errors }, { status: 422 });
  }

  const ProductPair =
    params.id === 'new'
      ? await createPair(data)
      : await updatePair(Number(params.id), data);

  return redirect(`/app/pairs/${ProductPair.id}`);
}

export default function ProductPairForm() {
  const shopify = useAppBridge();

  const errors = useActionData<typeof action>()?.errors || {};

  const ProductPair = useLoaderData<typeof loader>();

  const [formState, setFormState] = useState(ProductPair);
  const [cleanFormState, setCleanFormState] = useState(ProductPair);
  const [showShortageProductSelectModal, setShowShortageProductSelectModal] =
    useState(false);

  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const nav = useNavigation();
  const isSaving = nav.state === 'submitting' && nav.formMethod === 'POST';
  const isDeleting = nav.state === 'submitting' && nav.formMethod === 'DELETE';

  const navigate = useNavigate();

  // populate form state from ProductPair
  // useful when redirected from a new pair creation to an existing pair
  useEffect(() => {
    if (ProductPair?.id) {
      setFormState(ProductPair);
      setCleanFormState(ProductPair);
    }
  }, [ProductPair?.id]);

  async function openProductSelector() {
    const products = await shopify.resourcePicker({
      type: 'product',
      action: 'select', // customized action verb, either 'select' or 'add',
      filter: {
        hidden: true,
        variants: false,
        draft: true,
        archived: true,
      },
    });

    if (products) {
      const { images, id, variants, title, handle } = products[0];

      setFormState({
        ...formState,
        productId: id,
        productVariantId: variants[0].id,
        productTitle: title,
        productHandle: handle,
        productAlt: images[0]?.altText,
        productImage: images[0]?.originalSrc,
      });
    }
  }

  function openShortageProductSelector() {
    setShowShortageProductSelectModal(true);
  }

  function handleSelectShortageProduct(selectedItem) {
    const { slug, name, photo, organization } = selectedItem;
    setFormState({
      ...formState,
      shortageOrganizationSlug: organization.slug,
      shortageOrganizationName: organization.name,
      shortageProductSlug: slug,
      shortageProductName: name,
      shortageProductImage: photo,
    });
    setShowShortageProductSelectModal(false);
  }

  function handleCloseShortageProductSelectModal() {
    setShowShortageProductSelectModal(false);
  }

  const submit = useSubmit();
  async function handleSave() {
    const data = {
      productId: formState.productId || '',
      productVariantId: formState.productVariantId || '',

      shortageOrganizationSlug: formState.shortageOrganizationSlug,
      shortageOrganizationName: formState.shortageOrganizationName,
      shortageProductSlug: formState.shortageProductSlug,
      shortageProductName: formState.shortageProductName,
      shortageProductImage: formState.shortageProductImage,
    };

    setCleanFormState({ ...formState });
    submit(data, { method: 'post' });
  }

  return (
    <Page>
      {/* Breadcrumbs */}
      <ui-title-bar title={ProductPair.id ? 'Edit pair' : 'Create new pair'}>
        <button variant='breadcrumb' onClick={() => navigate('/app')}>
          Product pairs
        </button>
      </ui-title-bar>

      <Layout>
        {/* Product */}
        <Layout.Section variant='oneHalf'>
          <Card>
            <BlockStack gap='500'>
              <InlineStack align='space-between'>
                <Text as={'h2'} variant='headingLg'>
                  Your product
                </Text>
                {formState.productId ? (
                  <Button variant='plain' onClick={openProductSelector}>
                    Select another
                  </Button>
                ) : null}
              </InlineStack>

              {formState.productId ? (
                <InlineStack blockAlign='center' gap='500'>
                  <Thumbnail
                    source={formState.productImage || ImageIcon}
                    alt={formState.productAlt}
                    size='large'
                  />
                  <Text as='span' variant='headingMd' fontWeight='semibold'>
                    {formState.productTitle}
                  </Text>
                </InlineStack>
              ) : (
                <BlockStack gap='200'>
                  <Button
                    id='select-product'
                    size='large'
                    onClick={openProductSelector}
                  >
                    Select product
                  </Button>
                </BlockStack>
              )}

              {errors.productId ? (
                <InlineError message={errors.productId} fieldID='product' />
              ) : null}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Shortage Request */}
        <Layout.Section variant='oneHalf'>
          <Card>
            <BlockStack gap='500'>
              <InlineStack align='space-between'>
                <Text as={'h2'} variant='headingLg'>
                  Shortage request
                </Text>
                {formState.shortageProductSlug ? (
                  <Button variant='plain' onClick={openShortageProductSelector}>
                    Select another
                  </Button>
                ) : null}
              </InlineStack>

              {formState.shortageProductSlug ? (
                <InlineStack blockAlign='center' gap='500'>
                  <Thumbnail
                    source={formState.shortageProductImage || ImageIcon}
                    alt='Shortage product image'
                    size='large'
                  />

                  <BlockStack>
                    <Text as='span' variant='headingMd' fontWeight='semibold'>
                      <Link
                        url={getShortageProductUrl({
                          slug: formState.shortageProductSlug,
                          orgSlug: formState.shortageOrganizationSlug,
                        })}
                        target='_blank'
                        monochrome
                        removeUnderline
                      >
                        {formState.shortageProductName}
                      </Link>
                    </Text>
                    <div>
                      requested by{' '}
                      <Link
                        url={getOrganizationAddress({
                          orgSlug: formState.shortageOrganizationSlug,
                        })}
                        target='_blank'
                        monochrome
                        removeUnderline
                      >
                        {formState.shortageOrganizationName}
                      </Link>
                    </div>
                  </BlockStack>
                </InlineStack>
              ) : (
                <BlockStack gap='200'>
                  <Button
                    id='select-shortage-product'
                    size='large'
                    onClick={openShortageProductSelector}
                  >
                    Select product
                  </Button>
                </BlockStack>
              )}

              {errors.shortageProduct ? (
                <InlineError
                  message={errors.shortageProduct}
                  fieldID='shortageProduct'
                />
              ) : null}

              {errors.shortageProductImage ? (
                <InlineError
                  message={errors.shortageProductImage}
                  fieldID='shortageProduct'
                />
              ) : null}
            </BlockStack>
          </Card>

          {/* Shortage Products Modal */}
          {showShortageProductSelectModal ? (
            <ShortageProductSelectModal
              onSelect={handleSelectShortageProduct}
              onClose={handleCloseShortageProductSelectModal}
            />
          ) : null}
        </Layout.Section>

        {errors.pairExists ? (
          <Layout.Section>
            <Banner
              title='Product is already paired'
              tone='warning'
              action={{
                content: 'Select another product',
                onAction: openProductSelector,
              }}
              secondaryAction={{
                content: 'Go to existing pair',
                url: `/app/pairs/${errors.pairExists.existingPair.id}`,
              }}
            >
              Selected product is already paired with:{' '}
              <Link
                url={getShortageProductUrl({
                  slug: errors.pairExists.existingPair.shortageProductSlug,
                  orgSlug:
                    errors.pairExists.existingPair.shortageOrganizationSlug,
                })}
                target='_blank'
              >
                {errors.pairExists.existingPair.shortageProductName}
              </Link>
              . Either select another product or delete the existing pair.
            </Banner>
          </Layout.Section>
        ) : null}

        {/* Actions */}
        <Layout.Section>
          <PageActions
            secondaryActions={[
              {
                content: 'Delete',
                loading: isDeleting,
                disabled:
                  !ProductPair.id || !ProductPair || isSaving || isDeleting,
                destructive: true,
                outline: true,
                onAction: () => submit({}, { method: 'delete' }),
              },
            ]}
            primaryAction={{
              content: 'Save',
              loading: isSaving,
              disabled: !isDirty || isSaving || isDeleting,
              onAction: handleSave,
            }}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
