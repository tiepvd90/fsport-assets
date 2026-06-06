// Legacy loader for pages that include stickyfooter.js directly.
// cartpopup.js owns the ATC button click, popup opening, and ATWL tracking.
(function loadCartPopupJS() {
  const type = window.cartpopupType || "cartpopup";
  const script = document.createElement("script");
  script.src = `/js/${type}.js`;
  script.onload = () => console.log(`[StickyFooter] Loaded: ${script.src}`);
  script.onerror = () => console.error(`[StickyFooter] Failed to load: ${script.src}`);
  document.body.appendChild(script);
})();

setTimeout(() => {
  const callLink = document.getElementById("call-link");
  const chatLink = document.getElementById("chat-link");

  fetch("/json/settings.json")
    .then(res => res.json())
    .then(data => {
      if (callLink && data.tel) callLink.href = "tel:" + data.tel;
      if (chatLink && data["fb-page"]) chatLink.href = data["fb-page"];
    })
    .catch(err => console.warn("[StickyFooter] Cannot load settings.json", err));
}, 300);
