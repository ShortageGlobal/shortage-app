import { useState } from 'react';
import { json, redirect } from '@remix-run/node';
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
  useNavigate,
} from '@remix-run/react';
import { authenticate } from '../shopify.server';
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
} from '@shopify/polaris';
import { ImageMajor } from '@shopify/polaris-icons';
import { ShortageProductSelectModal } from '~/components/ShortageProductSelectModal/ShortageProductSelectModal';
import {
  getOrganizationAddress,
  getProductAddress,
} from '~/services/Shortage.service';

import db from '../db.server';
import {
  getProductPair,
  validateProductPair,
} from '../models/ProductPair.server';

export async function loader({ request, params }) {
  // [START authenticate]
  const { admin } = await authenticate.admin(request);
  // [END authenticate]

  // [START data]
  if (params.id === 'new') {
    return json({
      destination: 'product',
      title: '',
    });
  }

  return json(await getProductPair(Number(params.id), admin.graphql));
  // [END data]
}

export async function action({ request, params }) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  if (request.method === 'DELETE') {
    await db.shortageProductPair.delete({ where: { id: Number(params.id) } });
    return redirect('/app');
  }

  /** @type {any} */
  const data = {
    ...Object.fromEntries(await request.formData()),
    shop,
  };

  const errors = validateProductPair(data);

  if (errors) {
    return json({ errors }, { status: 422 });
  }

  const ProductPair =
    params.id === 'new'
      ? await db.shortageProductPair.create({ data })
      : await db.shortageProductPair.update({
          where: { id: Number(params.id) },
          data,
        });

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

  async function openProductSelector() {
    const products = await window.shopify.resourcePicker({
      type: 'product',
      action: 'select', // customized action verb, either 'select' or 'add',
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
      shortageOrganizationId: organization.slug,
      shortageOrganizationName: organization.name,
      shortageProductId: slug,
      shortageProductName: name,
      shortageProductImage: photo,
    });
  }

  const submit = useSubmit();
  function handleSave() {
    const data = {
      productId: formState.productId || '',
      productVariantId: formState.productVariantId || '',

      shortageOrganizationId: formState.shortageOrganizationId,
      shortageOrganizationName: formState.shortageOrganizationName,
      shortageProductId: formState.shortageProductId,
      shortageProductName: formState.shortageProductName,
      shortageProductImage: formState.shortageProductImage,
      // shortageVariantId,
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
                  Product
                </Text>
                {formState.productId ? (
                  <Button plain onClick={openProductSelector}>
                    Change product
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
                  {errors.productId ? (
                    <InlineError message={errors.productId} fieldID='product' />
                  ) : null}
                </VerticalStack>
              )}
            </VerticalStack>
          </Card>
        </Layout.Section>

        {/* Shortage Product */}
        <Layout.Section oneHalf>
          <Card>
            <VerticalStack gap='5'>
              <HorizontalStack align='space-between'>
                <Text as={'h2'} variant='headingLg'>
                  Shortage Product
                </Text>
                {formState.shortageProductId ? (
                  <Button plain onClick={openShortageProductSelector}>
                    Change product
                  </Button>
                ) : null}
              </HorizontalStack>
              {formState.shortageProductId ? (
                <HorizontalStack blockAlign='center' gap={'5'}>
                  <Thumbnail
                    source={formState.shortageProductImage || ImageMajor}
                    alt='Shortage product image'
                  />

                  <VerticalStack>
                    <Text as='span' variant='headingMd' fontWeight='semibold'>
                      <Link
                        url={getProductAddress({
                          slug: formState.shortageProductId,
                          orgSlug: formState.shortageOrganizationId,
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
                          orgSlug: formState.shortageOrganizationId,
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
                  {errors.productId ? (
                    <InlineError
                      message={errors.productId}
                      fieldID='shortageProduct'
                    />
                  ) : null}
                </VerticalStack>
              )}
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
