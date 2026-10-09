/**
 * Service để đăng nhập vào ví và lấy thông tin tài khoản từ API
 */

const API_BASE_URL = "https://api_gold.thinkdiff.us/api/vi";
const PASSWORD = "123456"; // Password mặc định cho API

/**
 * Đăng nhập vào ví bằng username
 * @param {string} username - Tên tài khoản / username
 * @returns {Promise<Object>} - Dữ liệu tài khoản từ API
 */
export const loginWallet = async (username) => {
  try {
    // Xây dựng URL API: /api/vi/vay_ngan_hang_9_8_p/VANG?password=123456
    const url = `${API_BASE_URL}/vay_ngan_hang_9_8_p/VANG?password=${PASSWORD}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Lưu username và password vào dữ liệu để có thể sử dụng sau
    const accountData = {
      ...data,
      username: username,
      password: PASSWORD, // Lưu password để dùng cho các API khác
      loginTime: new Date().toISOString(),
    };

    return accountData;
  } catch (error) {
    console.error("Lỗi khi đăng nhập ví:", error);
    throw error;
  }
};

/**
 * Lấy thông tin tài khoản từ localStorage (fallback khi API không hoạt động)
 * @param {string} username - Tên tài khoản
 * @returns {Object|null} - Dữ liệu tài khoản hoặc null
 */
export const getWalletFromStorage = (username) => {
  try {
    const accountStr = localStorage.getItem(`account_${username}`);
    return accountStr ? JSON.parse(accountStr) : null;
  } catch (error) {
    console.error("Lỗi khi đọc dữ liệu từ localStorage:", error);
    return null;
  }
};

/**
 * Đăng nhập ví - thử API trước, nếu không được thì dùng localStorage
 * @param {string} username - Tên tài khoản
 * @returns {Promise<Object>} - Dữ liệu tài khoản
 */
export const loginWalletWithFallback = async (username) => {
  try {
    // Thử đăng nhập bằng API trước
    const accountData = await loginWallet(username);
    return accountData;
  } catch (apiError) {
    console.warn("API đăng nhập thất bại, sử dụng dữ liệu từ localStorage:", apiError);
    
    // Fallback: Lấy dữ liệu từ localStorage
    const storageData = getWalletFromStorage(username);
    if (storageData) {
      return {
        ...storageData,
        username: username,
        password: PASSWORD, // Thêm password cho các API khác
        loginTime: new Date().toISOString(),
        source: "localStorage", // Đánh dấu nguồn dữ liệu
      };
    }

    // Nếu không có dữ liệu nào, throw error
    throw new Error(`Không thể đăng nhập ví ${username}. API không hoạt động và không có dữ liệu trong localStorage.`);
  }
};
