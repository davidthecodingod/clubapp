<script>
	let { data, form } = $props();
</script>

<div class="max-w-3xl mx-auto space-y-6 text-black">
	<div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
		<h1 class="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h1>
		<p class="text-sm text-gray-600 mb-6">Authorize new members and send them the shared group password.</p>

		{#if form?.error}
			<div class="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm border border-red-200">{form.error}</div>
		{/if}
		{#if form?.success}
			<div class="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-sm border border-green-200">{form.success}</div>
		{/if}

		<form method="POST" action="?/invite" class="flex gap-3">
			<input 
				type="email" 
				name="email" 
				placeholder="Member's Email Address" 
				required 
				class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black text-sm" 
			/>
			<button type="submit" class="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-600 font-medium text-sm transition-colors">
				Send Invite
			</button>
		</form>
	</div>

	<div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
		<h2 class="text-lg font-semibold text-gray-800 mb-4">Authorized Members</h2>
		<ul class="divide-y divide-gray-100">
			{#each data.users as u}
				<li class="py-3 flex justify-between items-center text-sm">
					<div>
						<span class="text-gray-900 font-medium">{u.email}</span>
						<span class="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold {u.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-800'}">
							{u.role}
						</span>
					</div>

					{#if u.email !== data.currentUserEmail}
						<form 
							method="POST" 
							action="?/deleteUser" 
							onsubmit={(e) => { if (!confirm(`Are you sure you want to remove ${u.email}?`)) e.preventDefault(); }}
						>
							<input type="hidden" name="email" value={u.email} />
							<button type="submit" class="text-red-600 hover:text-red-800 text-xs font-medium px-2.5 py-1 border border-red-200 rounded hover:bg-red-50 transition-colors">
								Remove
							</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
</div>