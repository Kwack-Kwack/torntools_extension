"use strict";

(async () => {
	await requireSidebar();

	featureManager.registerFeature(
		"Highlight Energy Refill",
		"sidebar",
		() => settings.pages.sidebar.highlightEnergy,
		null,
		applyStyle,
		applyStyle,
		{
			storage: ["settings.pages.sidebar.highlightEnergy", "userdata.refills.energy_refill_used"],
		},
		() => {
			if (!hasAPIData() || !settings.apiUsage.user.refills) return "No API access.";
		}
	);

	function applyStyle() {
		if (!userdata.refills.energy_refill_used && settings.pages.sidebar.highlightEnergy)
			document.getElementById("barEnergy").classList.add("tt-highlight-energy-refill");
		else document.getElementById("barEnergy").classList.remove("tt-highlight-energy-refill");
	}
})();
