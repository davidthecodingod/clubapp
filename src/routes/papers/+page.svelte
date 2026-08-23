<script>
	let { data, form } = $props();

	// Reactive search inputs
	let titleQuery = $state('');
	let aiQuery = $state('');

	// Fully automatic combined search (filters titles and scans document bodies instantly)
	let filteredPapers = $derived.by(() => {
		const tQuery = titleQuery.toLowerCase().trim();
		const aQuery = aiQuery.toLowerCase().trim();

		return data.papers.map(paper => {
			const titleText = paper.title.toLowerCase();
			const bodyText = (paper.content || '').toLowerCase();

			let score = 0;

			// 1. Check automatic AI content search if provided
			if (aQuery) {
				const keywords = aQuery.split(/\s+/).filter(w => w.length > 1);
				
				// Exact phrase match bonus
				if (bodyText.includes(aQuery) || titleText.includes(aQuery)) {
					score += 10;
				}

				// Keyword scoring inside body or title
				for (const kw of keywords) {
					if (bodyText.includes(kw) || titleText.includes(kw)) {
						score += 2;
					}
				}
			} else {
				score = 1; // Default score when no content search query is active
			}

			return { ...paper, score };
		})
		.filter(p => {
			const tQuery = titleQuery.toLowerCase().trim();
			const aQuery = aiQuery.toLowerCase().trim();
			
			const matchesTitle = !tQuery || p.title.toLowerCase().includes(tQuery);
			const matchesAi = !aQuery || p.score > 0;
			
			return matchesTitle && matchesAi;
		})
		.sort((a, b) => b.score - a.score);
	});
</script>

<div class="max-w-4xl mx-auto space-y-8 pb-12 text-black">
	<div class="border-b border-gray-200 pb-4">
		<h1 class="text-3xl font-bold tracking-tight text-gray-900">Publications & Papers</h1>
		<p class="text-sm text-white mt-1">Browse library documents, search titles, or type to automatically search document bodies.</p>
	</div>

	{#if form?.error}
		<div class="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">{form.success}</div>
	{/if}

	<div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
		<h2 class="text-lg font-semibold text-gray-900">Upload New Paper</h2>
		<form method="POST" action="?/upload" enctype="multipart/form-data" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label for="paper-title" class="block text-xs font-semibold uppercase text-gray-600 mb-1">Document Title</label>
				<input id="paper-title" type="text" name="title" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none" />
			</div>
			<div>
				<label for="paper-file" class="block text-xs font-semibold uppercase text-gray-600 mb-1">File (.docx, .txt)</label>
				<input id="paper-file" type="file" name="file" required class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-900 hover:file:bg-slate-400" />
			</div>
			<div class="sm:col-span-2">
				<button type="submit" class="bg-slate-900 text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-slate-600 transition-colors shadow-sm">
					Upload & Auto-Index Document
				</button>
			</div>
		</form>
	</div>


	<!-- Automatic Search Toolbar -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
		<div>
			<label for="title-filter" class="block text-xs font-semibold uppercase text-gray-600 mb-1">Filter by Title</label>
			<input 
				id="title-filter"
				type="text" 
				bind:value={titleQuery} 
				placeholder="Type title..." 
				class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none" 
			/>
		</div>

		<div>
			<label for="ai-filter" class="block text-xs font-semibold uppercase text-gray-600 mb-1">✨ Automatic Content Search</label>
			<input 
				id="ai-filter"
				type="text" 
				bind:value={aiQuery} 
				placeholder="Type to search inside document bodies instantly..." 
				class="w-full px-3 py-2 border border-black rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none bg-purple-50/30" 
			/>
		</div>
	</div>

	<!-- Papers List -->
	<div class="space-y-4">
		<div class="flex justify-between items-center">
			<h2 class="text-lg font-semibold text-gray-900">Available Documents</h2>
			<span class="text-xs text-gray-500">Showing {filteredPapers.length} of {data.papers.length}</span>
		</div>
		
		<div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
			{#each filteredPapers as paper}
				<div class="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
					<div class="space-y-1">
						<div class="flex items-center gap-2">
							<h3 class="font-semibold text-gray-900 text-sm">{paper.title}</h3>
							{#if aiQuery.trim() && paper.score > 1}
								<span class="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Match Found</span>
							{/if}
						</div>
						<p class="text-xs text-gray-500 line-clamp-1">
							{paper.content && paper.content !== paper.title ? paper.content : 'Indexed document file'}
						</p>
						<p class="text-[11px] text-gray-400">
							Posted by {paper.posterEmail || 'Unknown'}
						</p>
					</div>

					<div class="flex items-center gap-3 shrink-0">
						<a href={paper.fileName} target="_blank" class="text-xs bg-blue-50 text-black border border-slate-250 px-3 py-1.5 rounded-lg font-medium hover:bg-slate-400 transition-colors">
							View File
						</a>

						{#if data.user.email === paper.posterEmail}
							<form method="POST" action="?/delete" onsubmit={(e) => { if (!confirm(`Delete "${paper.title}"?`)) e.preventDefault(); }}>
								<input type="hidden" name="id" value={paper.id} />
								<button type="submit" class="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg font-medium hover:bg-rose-100 transition-colors">
									Delete
								</button>
							</form>
						{/if}
					</div>
				</div>
			{:else}
				<div class="p-8 text-center text-gray-500 italic text-sm">
					No matching documents found in titles or body text.
				</div>
			{/each}
		</div>
	</div>
</div>