// ✅ Fake Notification Script
const userPool = [
  "TuanTran", "MinhNguyen", "HuyenLe", "AnhT***", "B***Ngoc", 
"HoangA***", "L***Huong", "Q***Khanh", "P***Thao", "KimL***", 
"MyLinh", "ThanhT***", "NgocA***", "VanK***", "HaiD***", 
"ThuT***", "DucH***", "NhatM***", "B***Tram", "GiaB***",
"KhanhL***", "LienH***", "Phuoc***", "ThaoN***", "Vuong***",
"NamPh***", "HieuT***", "T***Anh", "LinhD***", "Phat***",
"T***Trang", "BaoN***", "Quynh***", "D***Tien", "HoaiA***",
"AnK***", "PhongL***", "Dieu***", "H***Phat", "MaiL***",
"Khang***", "SonT***", "YenL***", "Toan***", "Huong***",
"Kiet***", "VyL***", "LocT***", "Trang***", "Trung***"
];

const productPool = [
  "Vợt Phantom", "Vợt Gen4 Hồng", "Vợt AirForce Xám", "Vợt Teflon", 
  "Vợt Rồng Đen", "Vợt Gen4 Xám", "Vợt T700 Pro", "Vợt AirForce Đen", "Thuyền SUP", "Vợt Rồng Trắng"
];

const actionPool = [
  "Vừa Đặt Mua", "Vừa Thêm Vào Giỏ Hàng"
];

// ✅ Lấy 1 phần tử ngẫu nhiên từ mảng
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function showFakeNotification() {
  const user = randomItem(userPool);
  const product = randomItem(productPool);
  const action = randomItem(actionPool);

  const popup = document.getElementById("fakeNotification");
  popup.textContent = `${user} ${action} ${product}`;

  // ➡ Trượt vào màn hình
  popup.style.left = "20px";

  // ➡ Sau 5s thì trượt ra ngoài
  setTimeout(() => {
    popup.style.left = "-400px";
  }, 5000);

  // ➡ Random thời gian cho lần tiếp theo (20–40s)
  const nextTime = Math.floor(Math.random() * 20000) + 20000;
  setTimeout(showFakeNotification, nextTime);
}

// ✅ Bắt đầu chạy sau khi load trang
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(showFakeNotification, 5000); // Hiện popup đầu tiên sau 5s
});
