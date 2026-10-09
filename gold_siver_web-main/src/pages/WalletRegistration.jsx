import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./WalletRegistration.css";
import WalletAccountsList from "./WalletAccountsList";
import { logUserInfo } from "../utils/logUserInfo";
import { useTranslation } from "react-i18next";
const WalletRegistration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userIP, setUserIP] = useState(null);

  const emailCheckTimer = useRef(null);
  const usernameCheckTimer = useRef(null);

  const [location, setLocation] = useState(null);

  // ================= WALLET SEARCH =================
  const [walletList, setWalletList] = useState([]);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [walletSearchLoading, setWalletSearchLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimer = useRef(null);
  // ================= DEVICE INFO =================
  useEffect(() => {
    logUserInfo("Trang Đăng ký ví - WalletRegistration.jsx");
  }, []);


  // ================= GET IP =================
  useEffect(() => {
    const fetchUserIP = async () => {
      try {
        const now = new Date();
        const checkDay = now.getDate();
        const checkMonth = now.getMonth() + 1;
        const checkYear = now.getFullYear();

        const res = await fetch(
          `https://api_gold.thinkdiff.us/all_json_1_day/${checkDay}_${checkMonth}_${checkYear}`
        );

        const data = await res.json();

        if (data.status === "success" && data.ip_location) {
          setUserIP(data.ip_location);
        } else {
          setUserIP(null);
        }
      } catch (err) {
        console.error("Không lấy được IP:", err);
        setUserIP(null);
      }
    };

    fetchUserIP();

    return () => {
      if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);
      if (usernameCheckTimer.current) clearTimeout(usernameCheckTimer.current);
    };
  }, []);

  // ================= FETCH WALLETS BY IP =================
  const fetchWalletsByIP = async () => {
    if (!userIP) {
      setWalletList([]);
      setShowWalletDropdown(false);
      setIsDropdownOpen(false);
      return;
    }

    setWalletSearchLoading(true);
    try {
      const response = await fetch(
        `https://api_gold.thinkdiff.us/api/vi/find_by_iplocation/${userIP}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();

      if ((data.status === "ok" || data.status === "success") && data.data && Array.isArray(data.data)) {
        setWalletList(data.data);
        setShowWalletDropdown(true);
        setIsDropdownOpen(true); // Mở dropdown khi nhấn nút
      } else {
        setWalletList([]);
        setShowWalletDropdown(false);
        setIsDropdownOpen(false);
      }
    } catch (err) {
      console.error("Lỗi tìm kiếm ví:", err);
      setWalletList([]);
      setShowWalletDropdown(false);
      setIsDropdownOpen(false);
    } finally {
      setWalletSearchLoading(false);
    }
  };

  // ================= HANDLE WALLET SELECT =================
  const handleWalletSelect = (wallet) => {
    setSelectedWallet(wallet);
    setPasswordInput("");
    setPasswordError("");
    setShowPasswordModal(true);
    setIsDropdownOpen(false); // Đóng dropdown khi chọn
  };

  // ================= CONFIRM PASSWORD FOR WALLET =================
  const handlePasswordConfirm = async () => {
    if (!passwordInput.trim()) {
      setPasswordError("Vui lòng nhập mật khẩu");
      return;
    }

    setPasswordLoading(true);

    try {
      const verifyUrl = `https://api_gold.thinkdiff.us/api/vi/${selectedWallet.id_thongke_taikhoan}/VANG?password=${passwordInput}`;

      const response = await fetch(verifyUrl);

      if (!response.ok) {
        setPasswordError("Mật khẩu không chính xác");
        return;
      }

      // ✅ OK → lưu account
      const accountData = {
        email: selectedWallet.email,
        username: selectedWallet.id_thongke_taikhoan,
        id_taikhoan: selectedWallet.id_thongke_taikhoan,
        id_thongke_taikhoan: selectedWallet.id_thongke_taikhoan,
        password: passwordInput,
        ip_address: userIP,
      };

      localStorage.setItem("accountInfo", JSON.stringify(accountData));

      setShowPasswordModal(false);
      navigate(`/vi/${selectedWallet.id_thongke_taikhoan}`);

    } catch (err) {
      setPasswordError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    if (userIP) {
      fetchWalletsByIP();
    }

    return () => {
      if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);
      if (usernameCheckTimer.current) clearTimeout(usernameCheckTimer.current);
    };
  }, [userIP]);
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!value.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);

    searchTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api_gold.thinkdiff.us/api/vi/find/${value}`
        );
        const data = await response.json();

        if (
          (data.status === "ok" || data.status === "success") &&
          Array.isArray(data.data)
        ) {
          setSearchResults(data.data);
          setShowSearchResults(true);
        } else {
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } catch (err) {
        console.error(err);
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  };

  // ================= PASSWORD STRENGTH =================
  const getPasswordStrength = (password) => {
    if (!password)
      return {
        strength: 0,
        label: t("walletRegistration.passwordStrength.empty"),
        color: "#ccc",
      };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    let label = t("walletRegistration.passwordStrength.weak");
    let color = "#e74c3c";

    if (strength >= 4) {
      label = t("walletRegistration.passwordStrength.veryStrong");
      color = "#27ae60";
    } else if (strength >= 3) {
      label = t("walletRegistration.passwordStrength.strong");
    } else if (strength >= 2) {
      label = t("walletRegistration.passwordStrength.medium");
    }

    return { strength, label, color };
  };

  // ================= INPUT =================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ================= VALIDATE =================
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim())
      newErrors.email = t("walletRegistration.validation.email");
    if (!formData.username.trim())
      newErrors.username = t("walletRegistration.validation.username");
    if (!formData.password)
      newErrors.password = t("walletRegistration.validation.password");
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = t("walletRegistration.validation.confirmPassword");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("email", formData.email);
      formDataToSend.append("id_taikhoan", formData.username);
      formDataToSend.append("id_thongke_taikhoan", formData.username);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("password_vi", formData.password);

      if (location) {
        formDataToSend.append("location", JSON.stringify(location));
      }

      const response = await fetch(
        "https://api_gold.thinkdiff.us/api/vi/taotaikhoan",
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setSubmitted(true);
        setTimeout(() => navigate("/wallet-buy"), 1000);
      } else {
        setErrors({ submit: data.message || t("walletRegistration.submitError") });
      }
    } catch {
      setErrors({ submit: t("walletRegistration.submitError") });
    } finally {
      setLoading(false);
    }
  };

  const storedAccount = localStorage.getItem("accountInfo");

  // ================= JSX =================
  return (
    <div className="account-registration-container">
      <div className="registration-layout-wrapper">

        {/* ================= LEFT: REGISTER FORM ================= */}
        <div className="registration-left-section">
          <h1 className="registration-title">{t("walletRegistration.title")}</h1>

          {submitted && (
            <div className="success-message">
              ✓ {t("walletRegistration.success")}
            </div>
          )}

          {errors.submit && (
            <div className="error-message">
              ✗ {errors.submit || t("walletRegistration.submitError")}
            </div>
          )}

          <form onSubmit={handleSubmit} className="registration-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                {t("walletRegistration.email")} <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`form-input ${errors.email ? "input-error" : ""}`}
                disabled={loading}
              />
              {errors.email && (
                <span className="error-text">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="username" className="form-label">
                {t("walletRegistration.username")} <span className="required">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`form-input ${errors.username ? "input-error" : ""}`}
                disabled={loading}
              />
              {errors.username && (
                <span className="error-text">{errors.username}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                {t("walletRegistration.password")} <span className="required">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`form-input ${errors.password ? "input-error" : ""}`}
                disabled={loading}
              />

              {formData.password && (
                <div className="password-strength-container">
                  <div className="strength-bar">
                    <div
                      className="strength-fill"
                      style={{
                        width: `${(getPasswordStrength(formData.password).strength / 5) *
                          100
                          }%`,
                        backgroundColor:
                          getPasswordStrength(formData.password).color,
                      }}
                    />
                  </div>
                  <span
                    className="strength-label"
                    style={{
                      color: getPasswordStrength(formData.password).color,
                    }}
                  >
                    Độ mạnh: {getPasswordStrength(formData.password).label}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                {t("walletRegistration.confirmPassword")} <span className="required">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`form-input ${errors.confirmPassword ? "input-error" : ""
                  }`}
                disabled={loading}
              />
              {errors.confirmPassword && (
                <span className="error-text">{errors.confirmPassword}</span>
              )}
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading
                ? t("walletRegistration.loading")
                : t("walletRegistration.submit")}
            </button>
          </form>

          {storedAccount && (
            <div style={{ marginTop: "20px" }}>
              <button
                type="button"
                onClick={() => navigate("/danh-sach-vi")}
                className="view-wallet-list-btn"
              >
                {t("walletRegistration.viewWalletList")}
              </button>
            </div>
          )}
        </div>

        {/* ================= RIGHT: WALLET LIST ================= */}
        <div className="registration-right-section">
          <h1 className="wallet-list-title">{t("walletRegistration.walletListTitle")}</h1>

          <div className="wallet-search-section">
            <div className="search-box">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Tìm tài khoản..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="search-input"
                />

                {searchLoading && <p>Đang tìm...</p>}

                {showSearchResults && searchResults.length > 0 && (
                  <div className="wallet-dropdown search-dropdown">
                    {searchResults.map((wallet, index) => (
                      <div
                        key={index}
                        className="wallet-item"
                        onClick={() => handleWalletSelect(wallet)}
                      >
                        <div className="wallet-item-name">
                          👤 {wallet.id_thongke_taikhoan}
                        </div>
                        <div className="wallet-item-email">
                          📧 {wallet.email}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showSearchResults && searchResults.length === 0 && (
                  <p>Không tìm thấy tài khoản</p>
                )}
              </div>
            </div>
            {walletList.length > 0 && (
              <div className="wallet-dropdown">
                <p className="wallet-dropdown-title">{t("walletRegistration.walletOfYou")}</p>
                {walletList.map((wallet, index) => (
                  <div
                    key={index}
                    className="wallet-item"
                    onClick={() => handleWalletSelect(wallet)}
                  >
                    <div className="wallet-item-name">👤 {wallet.id_thongke_taikhoan}</div>
                    <div className="wallet-item-email">📧 {wallet.email}</div>
                    <div className="wallet-item-date">📅 {new Date(wallet.timecreate).toLocaleDateString("vi-VN")}</div>
                  </div>
                ))}
              </div>
            )}

            {!walletSearchLoading && walletList.length === 0 && (
              <p className="wallet-no-data">{t("walletRegistration.noWallets")}</p>
            )}

            {walletSearchLoading && (
              <p className="wallet-loading">⏳ {t("walletRegistration.loadingWallets")}</p>
            )}
          </div>
        </div>

      </div>

      {/* ================= PASSWORD MODAL ================= */}
      {showPasswordModal && (
        <div className="password-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="password-modal-header">
              <h3>{t("walletRegistration.passwordModal.title")}</h3>
              <button
                className="close-btn"
                onClick={() => setShowPasswordModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="password-modal-body">
              <p className="wallet-name">
                {t("walletRegistration.passwordModal.account")}: <strong>{selectedWallet?.id_thongke_taikhoan}</strong>
              </p>
              <p className="wallet-email">{selectedWallet?.email}</p>

              <input
                type="password"
                className="password-input"
                placeholder={t("walletRegistration.passwordModal.placeholder")}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handlePasswordConfirm();
                  }
                }}
                disabled={passwordLoading}
                autoFocus
              />
              {passwordError && (
                <p className="password-error">{passwordError}</p>
              )}
            </div>

            <div className="password-modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowPasswordModal(false)}
                disabled={passwordLoading}
              >
                {t("walletRegistration.passwordModal.cancel")}
              </button>
              <button
                className="confirm-btn"
                onClick={handlePasswordConfirm}
                disabled={passwordLoading}
              >
                {passwordLoading
                  ? t("walletRegistration.passwordModal.loading")
                  : t("walletRegistration.passwordModal.confirm")}
              </button>
            </div>

            <style>{`
              .password-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
              }

              .password-modal {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                width: 90%;
                overflow: hidden;
                animation: slideUp 0.3s ease;
              }

              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }

              .password-modal-header {
                background: linear-gradient(135deg, #FFD700 0%, #FFD700 100%);
                color: white;
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }

              .password-modal-header h3 {
                margin: 0;
                font-size: 18px;
                color: green !important;
              }

              .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
              }

              .close-btn:hover {
                transform: scale(1.2);
              }

              .password-modal-body {
                padding: 30px;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
              }

              .wallet-name {
                margin: 0 0 8px 0;
                color: #FFD700;
                font-size: 14px;
              }

              .wallet-name strong {
                color: #FFD700;
                font-weight: 600;
              }

              .wallet-email {
                margin: 0 0 20px 0;
                color: lightcoral;
                font-size: 12px;
              }

              .password-input {
                width: 100%;
                padding: 12px 15px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 16px;
                transition: all 0.3s;
                box-sizing: border-box;
                font-family: inherit;
                margin-bottom: 10px;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
              }

              .password-input:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                color: #FFD700;
              }

              .password-input:disabled {
                background: #f5f5f5;
                cursor: not-allowed;
              }

              .password-error {
                color: #e74c3c;
                font-size: 13px;
                margin: 0;
                text-align: center;
              }

              .password-modal-footer {
                padding: 20px;
                display: flex;
                gap: 10px;
                background: linear-gradient(135deg, #FFD700 0%, #FFD700 100%);
                border-top: 1px solid #e0e0e0;
              }

              .cancel-btn,
              .confirm-btn {
                flex: 1;
                padding: 12px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
              }

              .cancel-btn {
                background: #e0e0e0;
                color: #333;
              }

              .cancel-btn:hover:not(:disabled) {
                background: #d0d0d0;
              }

              .confirm-btn {
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                color: #ffd700 ;
              }

              .confirm-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
              }

              .cancel-btn:disabled,
              .confirm-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletRegistration;
