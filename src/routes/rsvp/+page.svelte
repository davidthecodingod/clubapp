<script>
	let { data, form } = $props();

	// Address autocomplete states
	let addressQuery = $state('');
	let selectedLocation = $state('');
	/** @type {any[]} */
	let suggestions = $state([]);
	let automaticLocation = '333 North Blvd, Los Angeles, CA, USA'; // Default fallback location
	let isLoading = $state(false);
	/** @type {ReturnType<typeof setTimeout>|undefined} */
	let debounceTimer;

	/** @param {Event & { currentTarget: HTMLInputElement }} e */
	function handleAddressInput(e) {
		const query = e.currentTarget.value;
		addressQuery = query;
		selectedLocation = '';

		clearTimeout(debounceTimer);
		if (!query || query.length < 3) {
			suggestions = [];
			return;
		}

		isLoading = true;
		debounceTimer = setTimeout(async () => {
			try {
				const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`);
				const data = await res.json();
				
				/** @type {any[]} */
				const features = data.features || [];

				suggestions = features.map((f) => {
					const p = f.properties;
					const houseNum = p.housenumber || '';
					const streetName = p.street || p.name || '';
					const streetPart = houseNum ? `${houseNum} ${streetName}` : streetName;
					
					const locationParts = [
						streetPart,
						p.city || p.town || p.village,
						p.state,
						p.country
					].filter(Boolean);

					return [...new Set(locationParts)].join(', ');
				});
			} catch (err) {
				console.error("Autocomplete error:", err);
			} finally {
				isLoading = false;
			}
		}, 200);
	}

	/** @param {string} addr */
	function selectAddress(addr) {
		addressQuery = addr;
		selectedLocation = addr;
		suggestions = [];
	}

	/** @param {SubmitEvent & { currentTarget: HTMLFormElement }} event */
	function handleCreateMeetingSubmit(event) {
		const form = event.currentTarget;
		const addressInput = form.elements.namedItem('address');

		if (addressInput && 'value' in addressInput) {
			addressInput.value = selectedLocation || automaticLocation;
		}
	}

	/**
	 * Safely read an RSVP from server-provided map without TS indexing errors.
	 * @param {any} map
	 * @param {number} id
	 * @returns {string|undefined}
	 */
	function getRsvp(map, id) {
		try {
			return map && map[id];
		} catch (err) {
			return undefined;
		}
	}
</script>

<div class="max-w-4xl mx-auto space-y-8 pb-12">
	<div class="border-b border-gray-200 pb-4">
		<h1 class="text-3xl font-bold tracking-tight text-gray-900">Club Meetings & RSVPs</h1>
		<p class="text-sm text-gray-600 mt-1">View upcoming events, submit your status, and stay connected.</p>
	</div>

	{#if form?.error}
		<div class="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
			{form.error}
		</div>
	{/if}
	{#if form?.success || form?.meetingSuccess}
		<div class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
			{form.success || form.meetingSuccess}
		</div>
	{/if}

	{#if data.user.role === 'admin'}
		<div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-black">
			<h2 class="text-lg font-semibold text-gray-900">Publish New Meeting (Admin)</h2>
			<form method="POST" action="?/createMeeting" onsubmit={handleCreateMeetingSubmit} class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label for="meeting-name" class="block text-xs font-semibold uppercase text-gray-600 mb-1">Meeting Name</label>
						<input id="meeting-name" type="text" name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none text-black" />
				</div>
				<div>
					<label for="meeting-date" class="block text-xs font-semibold uppercase text-gray-600 mb-1">Date & Time</label>
						<input id="meeting-date" type="datetime-local" name="date" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none text-black" />
				</div>
				
				<!-- Autocompleting Address with Street Numbers -->
				<div class="sm:col-span-2 relative">
					<label for="meeting-address" class="block text-xs font-semibold uppercase text-gray-600 mb-1">Address / Venue</label>
						<div class="relative">
							<input 
								id="meeting-address"
								type="text" 
								name="address" 
								bind:value={addressQuery}
								oninput={handleAddressInput}
						
								
								placeholder="e.g. 123 Main St..." 
								autocomplete="off"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none text-black" 
							/>
						
						{#if isLoading}
							<div class="absolute right-3 top-2.5 text-xs text-gray-400">Loading...</div>
						{/if}
					</div>

						{#if suggestions && suggestions.length > 0}
						<ul class="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
							{#each suggestions as item}
								<li>
									<button 
										type="button"
										onclick={() => selectAddress(item)}
										class="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-100 last:border-none"
									>
										📍 {item}
									</button>
								</li>
							{/each}
						</ul>
						{/if}
				</div>

				<div class="sm:col-span-2">
					<label for="meeting-picture" class="block text-xs font-semibold uppercase text-gray-600 mb-1">Picture URL (Optional)</label>
						<input id="meeting-picture" type="url" name="pictureUrl" placeholder="https://images.unsplash.com/..." class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:outline-none" />
				</div>
				<div>
					<button type="submit" class="bg-gray-600 text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-gray-950 transition-colors shadow-sm">
						Publish Meeting
					</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="space-y-6">
		{#each data.meetings as meeting}
			{@const currentStatus = data.rsvpMap[meeting.id]}
			{@const meetingRsvps = data.allRsvps.filter(r => r.meetingId === meeting.id)}
			{@const yesCount = meetingRsvps.filter(r => r.status === 'yes').length}
			{@const noCount = meetingRsvps.filter(r => r.status === 'no').length}
			{@const canDeleteMeeting = data.user.role === 'admin'}

			<div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md">
				{#if meeting.pictureUrl}
					<img src={meeting.pictureUrl} alt={meeting.name} class="w-full md:w-56 h-48 md:h-auto object-cover" />
				{/if}
				<div class="p-6 flex-1 space-y-4">
					<div class="flex justify-between items-start">
						<div>
							<h3 class="text-xl font-bold text-gray-900">{meeting.name}</h3>
							<p class="text-sm text-gray-600 mt-1">📅 {new Date(meeting.date).toLocaleString()}</p>
							<p class="text-sm text-gray-600">📍 {meeting.address}</p>
						</div>

						{#if canDeleteMeeting}
							<form 
								method="POST" 
								action="?/deleteMeeting"
								onsubmit={(e) => { if (!confirm(`Delete meeting "${meeting.name}"?`)) e.preventDefault(); }}
							>
								<input type="hidden" name="meetingId" value={meeting.id} />
								<button type="submit" class="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-lg hover:bg-rose-100 transition-colors font-medium">
									Delete Meeting
								</button>
							</form>
						{/if}
					</div>

					<form method="POST" action="?/rsvp" class="flex items-center gap-3 pt-2">
						<input type="hidden" name="meetingId" value={meeting.id} />
						<button 
							name="status" 
							value="yes" 
							class={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${currentStatus === 'yes' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
						>
							✓ RSVP Yes
						</button>
						<button 
							name="status" 
							value="no" 
							class={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${currentStatus === 'no' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
						>
							✕ RSVP No
						</button>
					</form>

					{#if data.user.role === 'admin'}
						<div class="mt-4 pt-4 border-t border-gray-100 text-xs space-y-2">
							<span class="font-bold uppercase tracking-wider text-gray-500 block">Admin Attendance Breakdown</span>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
								<div class="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100">
									<span class="font-bold text-emerald-800">Going ({yesCount}):</span>
									<p class="text-gray-600 mt-0.5 truncate">{meetingRsvps.filter(r => r.status === 'yes').map(r => r.email).join(', ') || 'None yet'}</p>
								</div>
								<div class="p-2.5 bg-rose-50/50 rounded-lg border border-rose-100">
									<span class="font-bold text-rose-800">Not Going ({noCount}):</span>
									<p class="text-gray-600 mt-0.5 truncate">{meetingRsvps.filter(r => r.status === 'no').map(r => r.email).join(', ') || 'None yet'}</p>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="text-center py-12 bg-white rounded-2xl border border-gray-200">
				<p class="text-gray-500 italic text-sm">No meetings scheduled right now.</p>
			</div>
		{/each}
	</div>
</div>