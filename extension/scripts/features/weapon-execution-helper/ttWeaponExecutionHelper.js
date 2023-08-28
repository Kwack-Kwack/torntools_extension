(async () => {
	const bonusPercentage = 0.15;

	let listener;
	let lowhealth = false;

	featureManager.registerFeature(
		"Weapon Execution Helper",
		"attack",
		() => settings.pages.attack.weaponExecutionHelper,
		undefined,
		addHealthListener,
		removeHealthListener,
		{
			storage: ["settings.pages.attack.weaponExecutionHelper"],
		},
		null
	);

	async function addHealthListener() {
		const health = await requireElement("div#defender span[id*='player-health-value_']");
		console.warn("starting...");
		listener = setInterval(() => {
			const [healthVal, maxHealth] = health?.textContent.split("/").map((n) => parseInt(n.replaceAll(",", "")));
			if (healthVal / maxHealth <= bonusPercentage && health.classList.contains("tt-low-health") === false) {
				console.log("LOW HEALTH!!");
				health.classList.add("tt-low-health");
			} else {
				health.classList.remove("tt-low-health");
			}
		}, 100);
	}

	function removeHealthListener() {
		if (listener) clearInterval(listener);
	}
})();
