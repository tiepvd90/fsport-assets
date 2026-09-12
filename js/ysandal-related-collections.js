(function () {
  "use strict";

  var host = document.getElementById("ysandalRelatedCollections");
  if (!host || host.dataset.initialized === "true") return;
  host.dataset.initialized = "true";
  host.innerHTML = '<div data-fsport-section="collection_grid"><div id="collectionContainer"></div></div>';

  window.collectionList = [
    {
      title: "YSANDAL COLLECTION",
      slug: "ysandal-collection"
    },
    {
      title: "PICKLEBALL COLLECTION",
      slug: "pickleball-collection"
    }
  ];

  var script = document.createElement("script");
  script.src = "/js/collection-grid.js?v=20260909-canonical-api";
  script.defer = true;
  document.body.appendChild(script);
})();
