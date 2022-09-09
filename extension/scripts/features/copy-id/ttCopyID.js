"use strict";

chrome.runtime.onMessage.addListener((url) => {
	toClipboard(url.replace(/\D/g, ""));
});
