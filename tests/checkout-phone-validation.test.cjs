const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync(require.resolve("../js/checkoutpopup.js"), "utf8");
const phoneHelpers = source.slice(
  source.indexOf("function parseVietnamCheckoutPhone"),
  source.indexOf("function setSpecificPhoneCorrectionError")
);
const eligibilityHelper = source.slice(
  source.indexOf("async function findEligibleSpecificPhoneCorrectionOrder"),
  source.indexOf("async function requestSpecificPhoneCorrection")
);

const storage = new Map();
const context = {
  console,
  SPECIFIC_PHONE_CORRECTION_KEY: "recovery",
  SPECIFIC_PHONE_CORRECTION_OLD_PHONE: "035323889",
  PURCHASED_ORDERS_KEY: "purchased",
  window: {
    FSPORT_SUPABASE_URL: "https://example.test",
    FSPORT_SUPABASE_ANON: "test-key"
  },
  localStorage: {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, value);
    }
  },
  readStoredOrderIds(key) {
    return JSON.parse(storage.get(key) || "[]");
  }
};

vm.createContext(context);
vm.runInContext(phoneHelpers + "\n" + eligibilityHelper, context);

function setCache(checkoutInfo, recoveryState) {
  storage.clear();
  if (checkoutInfo !== undefined) {
    storage.set("checkoutInfo", JSON.stringify(checkoutInfo));
  }
  if (recoveryState !== undefined) {
    storage.set("recovery", JSON.stringify(recoveryState));
  }
}

assert.equal(context.parseVietnamCheckoutPhone("0353238889").normalized, "0353238889");
assert.equal(context.parseVietnamCheckoutPhone("84 353 238 889").normalized, "0353238889");
assert.equal(context.parseVietnamCheckoutPhone("+84 353-238-889").normalized, "0353238889");
assert.equal(context.parseVietnamCheckoutPhone("035323889").normalized, null);

setCache(undefined, undefined);
assert.equal(context.shouldShowSpecificPhoneCorrection(), false, "empty cache must not show");

setCache({ phone: "0353238889" }, undefined);
assert.equal(context.shouldShowSpecificPhoneCorrection(), false, "another customer must not show");

setCache({ phone: "035323889" }, undefined);
assert.equal(context.shouldShowSpecificPhoneCorrection(), true, "target cached phone may proceed to backend check");

setCache({ phone: "+84 353 238 89" }, undefined);
assert.equal(context.shouldShowSpecificPhoneCorrection(), true, "target cached +84 form may proceed");

setCache({ phone: "035323889" }, { status: "completed" });
assert.equal(context.shouldShowSpecificPhoneCorrection(), false, "completed recovery must not show again");

async function testEligibility() {
  setCache({ phone: "035323889" }, undefined);
  storage.set("purchased", JSON.stringify(["wrong-order-id", "target-order-id"]));
  const checkedIds = [];
  context.fetch = async (_url, options) => {
    const id = JSON.parse(options.body).p_original_order_id;
    checkedIds.push(id);
    return {
      ok: true,
      async json() {
        return id === "target-order-id"
          ? {
              eligible: true,
              customer_phone: "035323889",
              customer_address: "Địa chỉ cũ",
              items: [{ product_name: "Legacy", color: "Vàng", quantity: 1 }]
            }
          : null;
      }
    };
  };

  const eligibility = await context.findEligibleSpecificPhoneCorrectionOrder();
  assert.equal(eligibility.originalOrderId, "target-order-id", "backend-confirmed cached UUID must be selected");
  assert.equal(eligibility.context.items[0].color, "Vàng", "verified order preview must be returned");
  assert.deepEqual(checkedIds, ["target-order-id"], "newest cached order is checked first");

  checkedIds.length = 0;
  storage.set("purchased", JSON.stringify(["wrong-order-id"]));
  assert.equal(
    await context.findEligibleSpecificPhoneCorrectionOrder(),
    null,
    "matching bad phone with the wrong cached UUID must not qualify"
  );
  assert.deepEqual(checkedIds, ["wrong-order-id"]);

  storage.set("purchased", "[]");
  assert.equal(await context.findEligibleSpecificPhoneCorrectionOrder(), null, "no cached UUID must not qualify");
}

testEligibility()
  .then(() => console.log("checkout phone validation tests: PASS"))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
