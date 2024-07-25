import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { Layout, Page } from '@shopify/polaris';
import { authenticate } from '~/shopify.server';
import { getProductPairs } from '~/models/ProductPair';
import { PairsList } from '~/components/PairsList/PairsList';

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const pairs = await getProductPairs(session.shop, admin.graphql);
  return json({ pairs });
}

export default function Index() {
  const { pairs } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <Page>
      <ui-title-bar title='Product pairs'>
        <button variant='primary' onClick={() => navigate('/app/pairs/new')}>
          Create pair
        </button>
      </ui-title-bar>

      <Layout>
        <Layout.Section>
          <PairsList pairs={pairs} />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
