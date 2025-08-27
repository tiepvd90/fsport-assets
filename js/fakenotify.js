// ✅ FAKE NOTIFY – HTML + CSS + LOGIC trong 1 file

const style = document.createElement("style");
style.textContent = `
#fakeNotification {
  position: fixed;
  bottom: 60px;
  left: -400px;
  z-index: 9999;
  background: #fff;
  padding: 10px 16px;
  border-radius: 99px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.6s ease;
  pointer-events: none;
  font-family: 'Be Vietnam Pro', sans-serif;
}
`;
document.head.appendChild(style);

// ✅ Tạo phần tử thông báo
const notifyDiv = document.createElement("div");
notifyDiv.id = "fakeNotification";
notifyDiv.textContent = "Vừa đặt hàng thành công";
document.body.appendChild(notifyDiv);

// 🟢 Danh sách user
const userPool = [
  "TuanVu", "M**n", "H***e", "AnhT***", "B***C",
  "HoangA***", "L***Huong", "Q***Khanh", "P***Thao", "KimL***",
  "MyLinh", "ThanhT***", "NgocA***", "VanK***", "HaiD***",
  "ThuT***", "DucH***", "NhatM***", "B***Tram", "GiaB***",
  "K***T", "LienH***", "Phuoc***", "ThaoN***", "Vuong***",
  "N***U", "HieuT***", "T***h", "L***D", "Phat***",
  "T***Trang", "BaoN***", "Quynh***", "D***Tien", "HoaiA***",
  "AnK***", "PhongL***", "Dieu***", "H***Phat", "MaiL***",
  "Khang***", "SonT***", "YenL***", "Toan***", "Huong***",
  "Kiet***", "VyL***", "LocT***", "Trang***", "Trung***"
];

// 🟠 Danh sách sản phẩm
const productPool = [
  "Vợt Phantom", "Vợt Gen4 Hồng", "Vợt AirForce", "Vợt Teflon", 
  "Vợt Rồng Đen", "Vợt Gen4 Xám", "Vợt T700 Pro", "Vợt AirForce", "Thuyền SUP", "Vợt Rồng Trắng"
];

// 🔵 Danh sách hành động
const actionPool = [
  "Vừa Đặt Mua", "Vừa Thêm Vào Giỏ"
];

// ✅ Hàm chọn ngẫu nhiên
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ✅ Hiển thị popup
function showFakeNotification() {
  const user = randomItem(userPool);
  const product = randomItem(productPool);
  const action = randomItem(actionPool);

  const popup = document.getElementById("fakeNotification");
  if (!popup) return;

  popup.textContent = `${user} ${action} ${product}`;
  popup.style.left = "20px";

  setTimeout(() => {
    popup.style.left = "-400px";
  }, 5000);

  const nextTime = Math.floor(Math.random() * 15000) + 10000;
  setTimeout(showFakeNotification, nextTime);
}

// ✅ Khởi động khi DOM ready
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(showFakeNotification, 5000);
});
