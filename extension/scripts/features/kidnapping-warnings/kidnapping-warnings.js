"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Kidnapping Warnings",
		"crimes",
		() => settings.pages.crimes.kidnapWarnings,
		initialise,
		hideKidnaps,
		unhideKidnaps,
		{
			storage: ["settings.pages.crimes.kidnapWarnings"]
		},
		null
	);

	function initialise() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.CRIMES_LOADED].push(() => {
			if (!feature.enabled()) return;
		});
	}

	async function hideKidnaps() {
		await requireSidebar();
		async () => {
			return await new Promise(() => {
				let checker = setInterval(() => {
					if(document.find(".div.msg-right-round").innerHTML.includes("Kidnapping is a risky business")) {
						console.log("user is kidnapping")
						clearInterval(checker)
					}
				}, 300)
			})
		}
		const cash = parseInt(document.querySelector("#user-money").innerHTML.split(",").join("").substring(1));
		if (cash > 75000) return;
		const msg = document.find(".msg.right-round");
		let hideCrime = [false, false, false, false];
		if (!msg.find(".tt-msg" && cash < 75000)) {
			msg.appendChild(
				document.newElement({
					type: "div",
					children: [
						document.newElement({
							type: "span",
							class: "tt-msg",
							text: "Some kidnapping crimes have been hidden by TornTools as your cash on hand is below 75k.",
						}),
					],
				})
			);
		}

		cash < 25000
			? (hideCrime = [true, true, false, true])
			: cash < 50000
			? (hideCrime = [false, true, false, true])
			: cash < 75000
			? (hideCrime = [false, false, false, true])
			: (hideCrime = [false, false, false, false]);


		for (var i = 0; i < 4; i++) {
			if (hideCrime[i]) {
				document.findAll("todo")[i].classList.add("tt-hidden");
			}
		}
	}

	function unhideKidnaps() {
		document.findAll(".tt-hidden").forEach((element) => element.classList.remove("tt-hidden"))
	}
})();
