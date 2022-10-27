"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Hospital Filter",
		"hospital",
		() => settings.pages.hospital.filter,
		initialiseFilters,
		addFilters,
		removeFilters,
		{
			storage: ["settings.pages.hospital.filter"],
		},
		null
	);

	function initialiseFilters() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.HOSPITAL_SWITCH_PAGE].push(() => {
			if (!feature.enabled()) return;

			filtering(true);
		});
	}

	const localFilters = {};

	async function addFilters() {
		await requireElement(".userlist-wrapper.hospital-list-wrapper .users-list .time");

		const { content } = createContainer("Hospital Filter", {
			class: "mt10",
			nextElement: document.find(".users-list-title"),
			compact: true,
			filter: true,
		});

		const statistics = createStatistics("players");
		content.appendChild(statistics.element);
		localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

		const filterContent = document.newElement({
			type: "div",
			class: "content",
		});

		const activityFilter = createFilterSection({
			type: "Activity",
			defaults: filters.hospital.activity,
			callback: filtering,
		});
		filterContent.appendChild(activityFilter.element);
		localFilters["Activity"] = { getSelections: activityFilter.getSelections };

		const reviveFilter = createFilterSection({
			title: "Revives",
			checkbox: "Enabled",
			defaults: filters.hospital.revivesOn,
			callback: filtering,
		});
		filterContent.appendChild(reviveFilter.element);
		localFilters["Revives"] = { isChecked: reviveFilter.isChecked };

		const factionFilter = createFilterSection({
			title: "Faction",
			select: [...defaultFactionsItems, { value: "CUSTOM", description: "Custom" }, ...getFactions()],
			defaults: "",
			callback: filtering,
		});
		filterContent.appendChild(factionFilter.element);
		localFilters["Faction"] = { getSelected: factionFilter.getSelected, updateOptions: factionFilter.updateOptions };

		const timeFilter = createFilterSection({
			title: "Time Filter",
			noTitle: true,
			slider: {
				min: 0,
				max: 100,
				step: 1,
				valueLow: filters.hospital.timeStart,
				valueHigh: filters.hospital.timeEnd,
			},
			callback: filtering,
		});
		filterContent.appendChild(timeFilter.element);
		localFilters["Time Filter"] = { getStartEnd: timeFilter.getStartEnd, updateCounter: timeFilter.updateCounter };

		const levelFilter = createFilterSection({
			title: "Level Filter",
			noTitle: true,
			slider: {
				min: 1,
				max: 100,
				step: 1,
				valueLow: filters.hospital.levelStart,
				valueHigh: filters.hospital.levelEnd,
			},
			callback: filtering,
		});
		filterContent.appendChild(levelFilter.element);
		localFilters["Level Filter"] = { getStartEnd: levelFilter.getStartEnd, updateCounter: levelFilter.updateCounter };

		content.appendChild(filterContent);

		await filtering();
	}

	async function filtering(pageChange) {
		await requireElement(".users-list > li");
		const content = findContainer("Hospital Filter").find("main");
		const activity = localFilters["Activity"].getSelections(content);
		const revivesOn = localFilters["Revives"].isChecked(content);
		const faction = localFilters["Faction"].getSelected(content).trim();
		const times = localFilters["Time Filter"].getStartEnd(content);
		const timeStart = parseInt(times.start);
		const timeEnd = parseInt(times.end);
		const levels = localFilters["Level Filter"].getStartEnd(content);
		const levelStart = parseInt(levels.start);
		const levelEnd = parseInt(levels.end);
		if (pageChange) {
			localFilters["Faction"].updateOptions([...defaultFactionsItems,  { value: "CUSTOM", description: "Custom" }, ...getFactions()], content);
		}

		// Update level and time slider counters
		localFilters["Time Filter"].updateCounter(`Time ${timeStart}h - ${timeEnd}h`, content);
		localFilters["Level Filter"].updateCounter(`Level ${levelStart} - ${levelEnd}`, content);

		// Save filters
		await ttStorage.change({
			filters: {
				hospital: {
					activity: activity,
					revivesOn: revivesOn,
					faction: faction,
					timeStart: timeStart,
					timeEnd: timeEnd,
					levelStart: levelStart,
					levelEnd: levelEnd,
				},
			},
		});

		if (faction == "CUSTOM" && !document.find(".tt-custom-faction-id")) {
			let input = document.find("#hospitalFilter .faction__section-class").appendChild(
				document.newElement({
					type: "div",
					class: "tt-custom-faction-id",
					children: [
						document.newElement({
							type: "input",
							class: "tt-custom-faction-id-input",
							attributes: { placeholder: "Faction Id", type: "text" },
						}),
					],
				})
			);
			input.addEventListener("keydown", (e) => {
				if (e.key == "Enter") {
					updateFilters();
				}
			});
		} else {
			if (faction != "CUSTOM" && document.find(".tt-custom-faction-id")) document.find(".tt-custom-faction-id").remove();
			updateFilters();
		}
		function updateFilters() {
			for (const li of document.findAll(".users-list > li")) {
				showRow(li);

				// Activity
				if (
					activity.length &&
					!activity.some((x) => x.trim() === li.find("#iconTray li").getAttribute("title").match(FILTER_REGEXES.activity)[0].toLowerCase().trim())
				) {
					hideRow(li);
					continue;
				}

				// Revives On
				if (revivesOn && li.find(".revive").classList.contains("reviveNotAvailable")) {
					hideRow(li);
					continue;
				}

				// Faction

				const rowFaction = li.find(".user.faction");
				const hasFaction = !!rowFaction.href;
				const factionName = rowFaction.hasAttribute("rel")
					? rowFaction.find(":scope > img").getAttribute("title").trim() || "N/A"
					: rowFaction.textContent.trim();
				const factionId = rowFaction.href.replace(/[^\d]/g, "");
				if (faction == "CUSTOM") {
					if (!getCustomId()) continue;
					if (factionId != getCustomId()) {
						hideRow(li);
						continue;
					}
				} else if (faction && faction !== "No faction" && faction !== "Unknown faction") {
					if (!hasFaction || factionName === "N/A" || factionName !== faction) {
						hideRow(li);
						continue;
					}
				} else if (faction === "No faction") {
					if (hasFaction) {
						hideRow(li);
						continue;
					}
				} else if (faction === "Unknown faction") {
					if (!hasFaction || factionName !== "N/A") {
						// Not "Unknown faction"
						hideRow(li);
						continue;
					}
				}

				// Time
				const timeLeftHrs = parseInt(li.find(".info-wrap .time").lastChild.textContent?.match(/(\d*)h/)?.[1]) || 0;
				if ((timeStart && timeLeftHrs < timeStart) || (timeEnd !== 100 && timeLeftHrs >= timeEnd)) {
					hideRow(li);
					continue;
				}
				// Level
				const level = li.find(".info-wrap .level").textContent.getNumber();
				if ((levelStart && level < levelStart) || (levelEnd !== 100 && level > levelEnd)) {
					hideRow(li);
					// noinspection UnnecessaryContinueJS
					continue;
				}
			}
		}

		function showRow(li) {
			li.classList.remove("tt-hidden");
		}

		function hideRow(li) {
			li.classList.add("tt-hidden");
		}

		localFilters["Statistics"].updateStatistics(
			document.findAll(".users-list > li:not(.tt-hidden)").length,
			document.findAll(".users-list > li").length,
			content
		);
	}

	function getCustomId() {
		if (!document.find(".tt-custom-faction-id-input")) return;
		return document.find(".tt-custom-faction-id-input").value;
	}

	function getFactions() {
		const rows = [...document.findAll(".users-list > li .user.faction")];
		const _factions = new Set(
			document.findAll(".users-list > li .user.faction img").length
				? rows
						.map((row) => row.find("img"))
						.filter((img) => !!img)
						.map((img) => img.getAttribute("title").trim())
						.filter((tag) => !!tag)
				: rows.map((row) => row.textContent.trim()).filter((tag) => !!tag)
		);
		/*
		const _factions = new Set(
			document.findAll(".users-list > li .user.faction img").length
				? rows
						.map((row) => ({ img: row.find("img"), id: row.href.replace(/[^\d]/g, "") }))
						.filter((obj) => !!obj.img)
						.map((obj) => ({ tag: obj.img.getAttribute("title").trim(), id: obj.id }))
						.filter((obj) => !!obj.tag)
						.map((obj) => ({ tag: obj.tag, id: obj.id }))
				: rows.map((row) => ({ tag: row.textContent.trim(), id: row.href.replace(/[^\d]/g, "") })).filter((obj) => !!obj.tag)
		);
		*/

		const factions = [];
		for (const faction of _factions) {
			factions.push({ value: faction, description: faction });
		}
		return factions;
	}

	function removeFilters() {
		removeContainer("Hospital Filter");
		document.findAll(".users-list > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
