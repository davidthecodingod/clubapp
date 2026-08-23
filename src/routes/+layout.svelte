<script>
	import './layout.css';
	import { page } from '$app/stores';

	let { data, children } = $props();
	let isLoginPage = $derived($page.url.pathname === '/');
</script>

<div class="min-h-screen bg-slate-900 text-white font-mono">
	{#if !isLoginPage}
		<nav class="bg-gray-800 border-b border-gray-200 shadow-sm">
			<div class="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
				<div class="flex items-center space-x-6">
					<span class="font-bold text-lg text-gray-300">Wyvern Club</span>
					<a href="/dashboard" class="text-white hover:text-gray-400 text-sm font-medium">Dashboard</a>
					<a href="/rsvp" class="text-white hover:text-gray-400 text-sm font-medium">RSVP</a>
					<a href="/papers" class="text-white hover:text-gray-400 text-sm font-medium">Pages</a>
				</div>
				<div class="flex items-center space-x-4">
					{#if data?.user?.role === 'admin'}
						<a href="/admin" class="text-sm font-bold bg-gray-500 text-gray-800 px-3 py-1.5 rounded-md border border-white hover:bg-gray-200">Admin Panel</a>
					{/if}
					
					<form method="POST" action="/logout">
						<button type="submit" class="text-sm font-medium text-white hover:text-red-600 px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
							Sign Out
						</button>
					</form>
				</div>
			</div>
		</nav>
	{/if}

	<main class="max-w-6xl mx-auto px-4 py-8">
		{@render children()}
	</main>
</div>