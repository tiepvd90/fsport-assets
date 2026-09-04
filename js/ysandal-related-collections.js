(function () {
  "use strict";

  var host = document.getElementById("ysandalRelatedCollections");
  if (!host || host.dataset.initialized === "true") return;
  host.dataset.initialized = "true";
  host.innerHTML = '<div data-fsport-section="collection_grid"><div id="collectionContainer"></div></div>';

  window.collectionList = [
    {
      title: "YSANDAL COLLECTION",
      slug: "ysandal-collection",
      json: "/json/ysandal-collection.json"
    },
    {
      title: "PICKLEBALL COLLECTION",
      slug: "pickleball-collection",
      json: "/json/pickleball-collection.json"
    }
  ];

  var script = document.createElement("script");
  script.src = "/js/collection-grid.js?v=20260716-inline-collection-1";
  script.defer = true;
  document.body.appendChild(script);
})();
