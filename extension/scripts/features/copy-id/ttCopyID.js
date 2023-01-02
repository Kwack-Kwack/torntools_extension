"use strict";

chrome.runtime.onMessage.addListener((url) => {
	const supportedPages = /factions.php|profiles.php|joblist.php/
	if (!!supportedPages.test(url)) {
		const id = url.replace(/\D+/g, ",").split(",").filter(e => e)[0] //TODO: let user choose IDs when multiple are present
		if (id) {
			toClipboard(id);
		} else {
			console.warn(`[TornTools] Copy ID - No ID found in url ${url}, clipboard cleared.`);
			toClipboard("");
		}
	} else {
		console.warn(`[TornTools] Copy ID - Unsupported destination URL, clipboard cleared.`);
		toClipboard("");
	}
});