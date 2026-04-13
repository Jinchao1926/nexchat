import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { getSession } from '$lib/auth/server';

export const load: PageServerLoad = async ({ fetch, request }) => {
  const result = await getSession({ fetch, request });

  if (result.error) {
    return {};
  }

  if (result.data?.user) {
    throw redirect(303, '/app');
  }

  return {};
};
