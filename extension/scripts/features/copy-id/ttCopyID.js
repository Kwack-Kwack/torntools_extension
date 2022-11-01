"use strict";

chrome.runtime.onMessage.addListener((url) => {
	const id = url.replace(/\D/g, "");
	if (id) {
		toClipboard(id);
	} else {
		console.warn(`[TornTools] Copy ID - no ID found in url ${url}`);
		toClipboard("");
	}
});