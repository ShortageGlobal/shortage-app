import { useState, useEffect } from 'react';
import { json, redirect } from '@remix-run/node';
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
  useNavigate,
} from '@remix-run/react';
import {
  Card,
  Button,
  HorizontalStack,
  InlineError,
  Layout,
  Page,
  Text,
  Thumbnail,
  VerticalStack,
  PageActions,
  Link,
  Banner,
} from '@shopify/polaris';
import { ImageMajor } from '@shopify/polaris-icons';
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
} from '~/models/ProductPair.server';

export async function loader({ request, params }) {
  // [START authenticate]
  const { admin } = await authenticate.admin(request);
  // [END authenticate]

  // [START data]
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
  // [END data]
}

export async function action({ request, params }) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  if (request.method === 'DELETE') {
    await deletePair(Number(params.id));
    return redirect('/app');
  }

  /** @type {any} */
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
  const errors = useActionData()?.errors || {};

  const ProductPair = useLoaderData();

  const [formState, setFormState] = useState(ProductPair);
  const [cleanFormState, setCleanFormState] = useState(ProductPair);

  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const [showShortageProductModal, setShowShortageProductModal] =
    useState(false);

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
    const products = await window.shopify.resourcePicker({
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
    setShowShortageProductModal(true);
  }

  function selectShortageProduct(selectedItem) {
    const { slug, name, photo, organization } = selectedItem;
    setFormState({
      ...formState,
      shortageOrganizationSlug: organization.slug,
      shortageOrganizationName: organization.name,
      shortageProductSlug: slug,
      shortageProductName: name,
      shortageProductImage: photo,
    });
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
        <Layout.Section oneHalf>
          <Card>
            <VerticalStack gap='5'>
              <HorizontalStack align='space-between'>
                <Text as={'h2'} variant='headingLg'>
                  Your product
                </Text>
                {formState.productId ? (
                  <Button plain onClick={openProductSelector}>
                    Select another
                  </Button>
                ) : null}
              </HorizontalStack>

              {formState.productId ? (
                <HorizontalStack blockAlign='center' gap={'5'}>
                  <Thumbnail
                    source={formState.productImage || ImageMajor}
                    alt={formState.productAlt}
                  />
                  <Text as='span' variant='headingMd' fontWeight='semibold'>
                    {formState.productTitle}
                  </Text>
                </HorizontalStack>
              ) : (
                <VerticalStack gap='2'>
                  <Button onClick={openProductSelector} id='select-product'>
                    Select product
                  </Button>
                </VerticalStack>
              )}

              {errors.productId ? (
                <InlineError message={errors.productId} fieldID='product' />
              ) : null}
            </VerticalStack>
          </Card>
        </Layout.Section>

        {/* Shortage Request */}
        <Layout.Section oneHalf>
          <Card>
            <VerticalStack gap='5'>
              <HorizontalStack align='space-between'>
                <Text as={'h2'} variant='headingLg'>
                  Shortage request
                </Text>
                {formState.shortageProductSlug ? (
                  <Button plain onClick={openShortageProductSelector}>
                    Select another
                  </Button>
                ) : null}
              </HorizontalStack>
              {formState.shortageProductSlug ? (
                <HorizontalStack blockAlign='center' gap={'5'}>
                  <Thumbnail
                    source={formState.shortageProductImage || ImageMajor}
                    alt='Shortage product image'
                  />

                  <VerticalStack>
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
                  </VerticalStack>
                </HorizontalStack>
              ) : (
                <VerticalStack gap='2'>
                  <Button
                    onClick={openShortageProductSelector}
                    id='select-shortage-product'
                  >
                    Select product
                  </Button>
                </VerticalStack>
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
            </VerticalStack>
          </Card>

          <ShortageProductSelectModal
            open={showShortageProductModal}
            onSelect={(selectedItem) => {
              selectShortageProduct(selectedItem);
            }}
            onClose={() => {
              setShowShortageProductModal(false);
            }}
          />
        </Layout.Section>

        {errors.pairExists ? (
          <Layout.Section>
            <Banner
              title='Product is already paired'
              status='warning'
              action={{
                content: 'Go to existing pair',
                url: `/app/pairs/${errors.pairExists.existingPair.id}`,
              }}
              secondaryAction={{
                content: 'Select another product',
                onAction: openProductSelector,
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
              . Either delete the existing pair or select another product.
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
