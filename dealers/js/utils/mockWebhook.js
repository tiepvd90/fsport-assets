// js/utils/mockWebhook.js - Mock webhook system for testing without Make.com
// This simulates a backend database for dealers

class MockWebhookSystem {
  constructor() {
    // Simulate a dealer database stored in localStorage
    this.dealersKey = "mock_dealers_db";
    this.initializeDB();
  }

  initializeDB() {
    if (!localStorage.getItem(this.dealersKey)) {
      localStorage.setItem(this.dealersKey, JSON.stringify([]));
    }
  }

  getDealers() {
    try {
      const data = localStorage.getItem(this.dealersKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveDealers(dealers) {
    localStorage.setItem(this.dealersKey, JSON.stringify(dealers));
  }

  // Handle registration webhook
  async handleRegistration(payload) {
    const { email, fullname, phone, address, password } = payload;

    if (!email || !fullname || !phone || !address || !password) {
      return {
        success: false,
        message: "Vui lòng điền đầy đủ tất cả thông tin"
      };
    }

    const dealers = this.getDealers();

    // Check if email already exists
    const existingDealer = dealers.find(d => d.email === email.toLowerCase());
    if (existingDealer) {
      return {
        success: false,
        message: "Email đã được đăng ký, vui lòng đăng nhập."
      };
    }

    // Create new dealer record
    const newDealer = {
      email: email.toLowerCase(),
      fullname,
      phone,
      address,
      password, // In real system, this should be hashed
      minOrderQuantity: 10,
      createdAt: new Date().toISOString()
    };

    dealers.push(newDealer);
    this.saveDealers(dealers);

    // Return dealer info without password
    return {
      success: true,
      message: "Đăng ký thành công",
      data: {
        email: newDealer.email,
        fullname: newDealer.fullname,
        phone: newDealer.phone,
        address: newDealer.address,
        minOrderQuantity: newDealer.minOrderQuantity
      }
    };
  }

  // Handle login webhook
  async handleLogin(payload) {
    const { email, password } = payload;

    if (!email || !password) {
      return {
        success: false,
        message: "Email hoặc mật khẩu không đúng"
      };
    }

    const dealers = this.getDealers();
    const dealer = dealers.find(d => d.email === email.toLowerCase());

    if (!dealer || dealer.password !== password) {
      return {
        success: false,
        message: "Email hoặc mật khẩu không đúng"
      };
    }

    // Return dealer info
    return {
      success: true,
      message: "Đăng nhập thành công",
      data: {
        email: dealer.email,
        fullname: dealer.fullname,
        phone: dealer.phone,
        address: dealer.address,
        minOrderQuantity: dealer.minOrderQuantity
      }
    };
  }

  // Handle profile update
  async handleUpdateProfile(payload) {
    const { email, fullname, phone, address } = payload;

    if (!email) {
      return {
        success: false,
        message: "Email không hợp lệ"
      };
    }

    const dealers = this.getDealers();
    const dealerIndex = dealers.findIndex(d => d.email === email.toLowerCase());

    if (dealerIndex === -1) {
      return {
        success: false,
        message: "Không tìm thấy tài khoản"
      };
    }

    // Update dealer info
    if (fullname) dealers[dealerIndex].fullname = fullname;
    if (phone) dealers[dealerIndex].phone = phone;
    if (address) dealers[dealerIndex].address = address;
    dealers[dealerIndex].updatedAt = new Date().toISOString();

    this.saveDealers(dealers);

    return {
      success: true,
      message: "Cập nhật thành công",
      data: {
        email: dealers[dealerIndex].email,
        fullname: dealers[dealerIndex].fullname,
        phone: dealers[dealerIndex].phone,
        address: dealers[dealerIndex].address,
        minOrderQuantity: dealers[dealerIndex].minOrderQuantity
      }
    };
  }

  // Handle password change
  async handleChangePassword(payload) {
    const { email, currentPassword, newPassword } = payload;

    if (!email || !currentPassword || !newPassword) {
      return {
        success: false,
        message: "Vui lòng điền đầy đủ mật khẩu"
      };
    }

    const dealers = this.getDealers();
    const dealerIndex = dealers.findIndex(d => d.email === email.toLowerCase());

    if (dealerIndex === -1) {
      return {
        success: false,
        message: "Không tìm thấy tài khoản"
      };
    }

    // Verify current password
    if (dealers[dealerIndex].password !== currentPassword) {
      return {
        success: false,
        message: "Mật khẩu hiện tại không đúng"
      };
    }

    // Update password
    dealers[dealerIndex].password = newPassword;
    dealers[dealerIndex].updatedAt = new Date().toISOString();
    this.saveDealers(dealers);

    return {
      success: true,
      message: "Đổi mật khẩu thành công"
    };
  }

  // Route incoming webhook requests
  async handle(url, payload) {
    // Extract the action from the payload
    const action = payload.action || "";

    console.log(`[MockWebhook] Handling ${action}:`, payload);

    if (action === "register") {
      return await this.handleRegistration(payload);
    } else if (action === "login") {
      return await this.handleLogin(payload);
    } else if (action === "updateDealer") {
      return await this.handleUpdateProfile(payload);
    } else if (action === "changePassword") {
      return await this.handleChangePassword(payload);
    } else {
      return {
        success: false,
        message: "Hành động không hợp lệ"
      };
    }
  }
}

// Create singleton instance
const mockWebhook = new MockWebhookSystem();

export default mockWebhook;
