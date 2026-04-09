// ===== F-SPORT ERP UTILS =====

window.ERP_UTILS = {};


// ===== NORMALIZE TEXT (BỎ DẤU, LOWERCASE) =====
ERP_UTILS.normalize = function (str = "") {
  return str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ") // bỏ ký tự lạ
    .replace(/\s+/g, " ")
    .trim();
};



// ===== SPLIT KEYWORD =====
ERP_UTILS.splitKeyword = function (str = "") {
  return ERP_UTILS.normalize(str).split(" ").filter(Boolean);
};



// ===== MATCH ALL KEYWORD =====
ERP_UTILS.matchKeyword = function (text, keyword) {
  const words = ERP_UTILS.splitKeyword(keyword);
  if (!words.length) return true;

  return words.every(w => text.includes(w));
};



// ===== DEBOUNCE =====
ERP_UTILS.debounce = function (fn, delay = 200) {
  let timer;

  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};



// ===== FORMAT NUMBER =====
ERP_UTILS.formatNumber = function (num) {
  if (!num && num !== 0) return "0";

  try {
    return Number(num).toLocaleString("vi-VN");
  } catch (e) {
    return num;
  }
};



// ===== FORMAT MONEY =====
ERP_UTILS.formatMoney = function (num) {
  return ERP_CONFIG.formatCurrency(num);
};



// ===== CLAMP =====
ERP_UTILS.clamp = function (value, min, max) {
  return Math.min(Math.max(value, min), max);
};



// ===== GENERATE ID =====
ERP_UTILS.uid = function () {
  return "id_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
};



// ===== COPY TEXT =====
ERP_UTILS.copy = async function (text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
};



// ===== LONG PRESS (GIỮ NÚT) =====
ERP_UTILS.longPress = function (element, callback) {
  let timer = null;
  let interval = null;

  const delay = ERP_CONFIG.inventory.longPressDelay;
  const speed = ERP_CONFIG.inventory.longPressInterval;

  const start = (e) => {
    e.preventDefault();

    timer = setTimeout(() => {
      interval = setInterval(() => {
        callback();
      }, speed);
    }, delay);
  };

  const stop = () => {
    clearTimeout(timer);
    clearInterval(interval);
    timer = null;
    interval = null;
  };

  element.addEventListener("touchstart", start);
  element.addEventListener("mousedown", start);

  element.addEventListener("touchend", stop);
  element.addEventListener("mouseup", stop);
  element.addEventListener("mouseleave", stop);
};



// ===== VIBRATE =====
ERP_UTILS.vibrate = function (ms = 10) {
  ERP_CONFIG.vibrate(ms);
};



// ===== SCROLL TO TOP =====
ERP_UTILS.scrollTop = function () {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};



// ===== SIMPLE RENDER HTML =====
ERP_UTILS.html = function (strings, ...values) {
  return strings.reduce((acc, str, i) => {
    return acc + str + (values[i] ?? "");
  }, "");
};



// ===== SAFE NUMBER =====
ERP_UTILS.toNumber = function (val) {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
};



// ===== GROUP BY =====
ERP_UTILS.groupBy = function (arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
};



// ===== SORT SIZE (CHO DÉP) =====
ERP_UTILS.sortSize = function (a, b) {
  return ERP_UTILS.toNumber(a.size) - ERP_UTILS.toNumber(b.size);
};



// ===== HIGHLIGHT KEYWORD =====
ERP_UTILS.highlight = function (text, keyword) {
  if (!keyword) return text;

  const kw = ERP_UTILS.normalize(keyword);
  const raw = ERP_UTILS.normalize(text);

  if (!raw.includes(kw)) return text;

  const regex = new RegExp(`(${keyword})`, "gi");

  return text.replace(regex, "<mark>$1</mark>");
};



// ===== LIMIT ARRAY =====
ERP_UTILS.limit = function (arr, n) {
  return arr.slice(0, n);
};



// ===== EMPTY CHECK =====
ERP_UTILS.isEmpty = function (val) {
  return val === null || val === undefined || val === "";
};



// ===== LOG =====
ERP_UTILS.log = function (...args) {
  ERP_CONFIG.log(...args);
};