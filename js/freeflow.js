// ✅ FreeFlow v1 – Thuật toán hiển thị nội dung
let freeflowData = [];
let filteredFeed = [];

async function fetchFreeFlowData(jsonUrl) {
  try {
    const res = await fetch(jsonUrl);
    freeflowData = await res.json();
    updateFeed();
  } catch (err) {
    console.warn("Không thể tải FreeFlow JSON:", err);
  }
}

function updateFeed(searchTerm = "") {
  filteredFeed = freeflowData.map(item => {
    let searchModifier = item.tags.some(tag => tag.includes(searchTerm)) ? 10 : 0;
    item.finalPriority = item.basePriority + searchModifier;
    return item;
  }).sort((a, b) => b.finalPriority - a.finalPriority);

  renderFeed(filteredFeed);
}

function renderFeed(feed) {
  const container = document.getElementById("freeflowFeed");
  if (!container) return;

  container.innerHTML = "";
  feed.forEach(item => {
    const div = document.createElement("div");
    div.className = "feed-item";
    div.innerHTML = `
      ${item.contentType === "image" ? `<img src="${item.image}" alt="${item.title}">` : ""}
      ${item.contentType === "youtube" ? `<iframe src="https://www.youtube.com/embed/${item.youtube}" frameborder="0" allowfullscreen></iframe>` : ""}
      <h4>${item.title}</h4>
    `;
    div.onclick = () => window.location.href = item.productPage;
    container.appendChild(div);
  });
}
