<script>
	import { onMount } from 'svelte';
	import gsap from 'gsap';
	import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

	let { form } = $props();

	// State toggle between Login and Forgot Password view
	let isForgotPassword = $state(false);

	/** @type {HTMLDivElement | undefined} */
	let containerEl;
	/** @type {HTMLDivElement | undefined} */
	let centerLineEl;
	/** @type {HTMLDivElement | undefined} */
	let clubTextEl;
	/** @type {HTMLDivElement | undefined} */
	let topPanelEl;
	/** @type {HTMLDivElement | undefined} */
	let bottomPanelEl;
	/** @type {HTMLDivElement | undefined} */
	let loginFormEl;

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);

		const container = containerEl;
		const centerLine = centerLineEl;
		const clubText = clubTextEl;
		const topPanel = topPanelEl;
		const bottomPanel = bottomPanelEl;
		const loginForm = loginFormEl;

		if (!container || !centerLine || !clubText || !topPanel || !bottomPanel || !loginForm) {
			return;
		}

		// Pin the container during the scroll sequence
		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: container,
				start: 'top top',
				end: '+=3000', // Scroll distance to complete sequence
				scrub: 1,
				pin: true,
				anticipatePin: 1
			}
		});

		// Phase 1: Text swipes off to the left
		tl.to(clubText, {
			xPercent: -150,
			opacity: 0,
			ease: 'power2.inOut',
			duration: 1
		})

		// Phase 2: The split line fades out slightly as doors open
		.to(centerLine, {
			opacity: 0,
			duration: 0.2
		}, '-=0.2')

		// Phase 3: The two black panels slide apart vertically (top goes up, bottom goes down)
		.to(topPanel, {
			yPercent: -100,
			ease: 'power2.inOut',
			duration: 2
		}, 'open')
		.to(bottomPanel, {
			yPercent: 100,
			ease: 'power2.inOut',
			duration: 2
		}, 'open')

		// Phase 4: Login form fades in as white background is revealed
		.fromTo(loginForm, {
			opacity: 0,
			scale: 0.95
		}, {
			opacity: 1,
			scale: 1,
			ease: 'power2.out',
			duration: 1
		});
	});

	function toggleMode() {
		isForgotPassword = !isForgotPassword;
	}
</script>

<!-- Outer scroll wrapper -->
<div bind:this={containerEl} class="relative w-full h-screen bg-white overflow-hidden font-mono select-none">
	
	<!-- Split Screen Container (Black panels overlaying white background) -->
	<div class="absolute inset-0 z-20 flex flex-col w-full h-full pointer-events-none">
		<!-- Top Black Panel -->
		<div bind:this={topPanelEl} class="w-full h-1/2 bg-black"></div>
		<!-- Bottom Black Panel -->
		<div bind:this={bottomPanelEl} class="w-full h-1/2 bg-black"></div>
	</div>

	<!-- Center Horizontal Dividing Line with "The Club" Text -->
	<div bind:this={centerLineEl} class="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
		<!-- Light horizontal dividing line across the middle -->
		<div class="absolute w-full h-px bg-white/30"></div>
		
		<!-- Centered Text -->
		<div bind:this={clubTextEl} class="relative bg-black px-6 py-2 text-white text-sm tracking-widest uppercase border border-white/10">
			The Club
		</div>
	</div>

	<!-- Revealed Content Layer (Login / Forgot Password Form on White Background) -->
	<div class="absolute inset-0 z-10 flex items-center justify-center bg-white text-black p-6">
		<div bind:this={loginFormEl} class="max-w-md w-full space-y-8 opacity-0">
			
			{#if !isForgotPassword}
				<!-- LOGIN VIEW -->
				<div class="space-y-2 text-center">
					<h2 class="text-2xl font-light tracking-tight">ACCESS AUTHORIZATION</h2>
					<p class="text-xs text-black/60">Authenticate your secure credentials below.</p>
				</div>

				{#if form?.loginError}
					<div class="p-3 bg-black text-white text-xs tracking-wider text-center">
						ERROR: {form.loginError}
					</div>
				{/if}

				{#if form?.forgotSuccess}
					<div class="p-3 bg-black text-white text-xs tracking-wider text-center">
						{form.forgotSuccess}
					</div>
				{/if}

				<form method="POST" action="?/login" class="space-y-6">
					<div class="space-y-1">
						<label for="login-email" class="block text-[10px] tracking-widest uppercase text-black/60">Email Identification</label>
						<input 
							id="login-email"
							type="email" 
							name="email" 
							required 
							placeholder="user@domain.com" 
							class="w-full px-0 py-3 bg-transparent border-b border-black text-sm focus:outline-none focus:border-black placeholder:text-black/30 rounded-none" 
						/>
					</div>

					<div class="space-y-1">
						<div class="flex justify-between items-center">
							<label for="login-password" class="block text-[10px] tracking-widest uppercase text-black/60">Access Key / Group Password</label>
							<button 
								type="button"
								onclick={toggleMode}
								class="text-[10px] tracking-widest uppercase text-black/50 hover:text-black underline transition-colors"
							>
								Forgot?
							</button>
						</div>
						<input 
							id="login-password"
							type="password" 
							name="password" 
							required 
							placeholder="••••••••••••" 
							class="w-full px-0 py-3 bg-transparent border-b border-black text-sm focus:outline-none focus:border-black placeholder:text-black/30 rounded-none" 
						/>
					</div>

					<button 
						type="submit" 
						class="w-full mt-4 bg-black text-white font-medium py-4 text-xs tracking-widest uppercase hover:bg-black/80 transition-all rounded-none"
					>
						Initialize Session
					</button>
				</form>

			{:else}
				<!-- FORGOT PASSWORD VIEW -->
				<div class="space-y-2 text-center">
					<h2 class="text-2xl font-light tracking-tight">CIPHER RECOVERY</h2>
					<p class="text-xs text-black/60">Enter your registered email to receive a recovery link.</p>
				</div>

				{#if form?.forgotSuccess}
					<div class="p-3 bg-black text-white text-xs tracking-wider text-center">
						{form.forgotSuccess}
					</div>
				{/if}

				<form method="POST" action="?/forgot" class="space-y-6">
					<div class="space-y-1">
						<label for="forgot-email" class="block text-[10px] tracking-widest uppercase text-black/60">Registered Email</label>
						<input 
							id="forgot-email"
							type="email" 
							name="email" 
							required 
							placeholder="user@domain.com" 
							class="w-full px-0 py-3 bg-transparent border-b border-black text-sm focus:outline-none focus:border-black placeholder:text-black/30 rounded-none" 
						/>
					</div>

					<button 
						type="submit" 
						class="w-full mt-4 bg-black text-white font-medium py-4 text-xs tracking-widest uppercase hover:bg-black/80 transition-all rounded-none"
					>
						Transmit Recovery Link
					</button>

					<div class="text-center pt-2">
						<button 
							type="button" 
							onclick={toggleMode}
							class="text-[10px] tracking-widest uppercase text-black/60 hover:text-black transition-colors underline"
						>
							← Return to Authorization
						</button>
					</div>
				</form>
			{/if}

		</div>
	</div>

</div>