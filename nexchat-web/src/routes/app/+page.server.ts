import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { getConversations } from '$lib/api/modules/conversations';
import { getSession } from '$lib/auth/server';

export const load: PageServerLoad = async ({ fetch, request }) => {
  const sessionResult = await getSession<{ user?: unknown }>({ fetch, request });

  if (sessionResult.error || !sessionResult.data?.user) {
    throw redirect(303, '/');
  }

  const { data: conversations } = await getConversations({ fetch, request });

  return { session: sessionResult.data, conversations };
};
