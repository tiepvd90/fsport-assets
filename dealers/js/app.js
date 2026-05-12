// js/app.js - App entry point. Routes to the correct page module based on
// the data-page attribute on <body>.
import RegisterPage from "./pages/register.js";
import LoginPage from "./pages/login.js";
import DashboardPage from "./pages/dashboard.js";
import OrderHistoryPage from "./pages/order-history.js";
import AccountPage from "./pages/account.js";

const routes = {
  register: RegisterPage,
  login: LoginPage,
  dashboard: DashboardPage,
  "order-history": OrderHistoryPage,
  account: AccountPage,
};

function start() {
  const page = document.body?.dataset?.page;
  console.log("[app.js start] Page detected:", page);

  if (!page) {
    console.warn("[app] No data-page attribute on <body>, skipping init.");
    return;
  }
  const handler = routes[page];
  if (!handler || typeof handler.init !== "function") {
    console.warn(`[app] No handler registered for page="${page}".`);
    return;
  }
  try {
    console.log(`[app.js start] ✅ Calling init for page: ${page}`);
    handler.init();
    console.log(`[app.js start] ✅ init completed for page: ${page}`);
  } catch (err) {
    console.error(`[app] init failed for page="${page}":`, err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}

export default { start };
