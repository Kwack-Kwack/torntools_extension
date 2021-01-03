requireDatabase().then(() => {
	console.log("TT - Education");
	hideCompletedCategories();
});

function hideCompletedCategories() {
	if (window.location.href.includes("step=main")) {
		for (let category of doc.findAll(".education .ajax-act")) {
			if (category.find(".bar-green-wrap-white-bg").style.width === "100%") category.style.opacity = "0.2";
		}
	};
};
