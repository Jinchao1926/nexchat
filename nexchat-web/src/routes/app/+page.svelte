<script lang="ts">
  import { goto } from '$app/navigation';

  import { signOut } from '$lib/auth/api';

  type AppPageData = {
    session: {
      user: {
        email: string;
      };
    };
  };

  let { data }: { data: AppPageData } = $props();

  async function handleLogout() {
    await signOut();
    await goto('/');
  }
</script>

<svelte:head>
  <title>NexChat App</title>
</svelte:head>

<section class="app-shell">
  <header>
    <h1>NexChat</h1>
    <p>Logged in as {data.session.user.email}</p>
  </header>

  <main>
    <h2>App placeholder</h2>
    <p>This protected area will become the Doubao-style chat workspace.</p>

    <button type="button" onclick={handleLogout}>Logout</button>
  </main>
</section>
