import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Wallet.css";
import { logUserInfo } from "../utils/logUserInfo";
import { useTranslation } from "react-i18next";

const Wallet = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [accountInfo, setAccountInfo] = useState(null);
  const [nhaVangList, setNhaVangList] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [distanceKm, setDistanceKm] = useState("20");
  const [filteredNhaVangList, setFilteredNhaVangList] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempDistanceKm, setTempDistanceKm] = useState(distanceKm);
  const [tempSelectedNhaVang, setTempSelectedNhaVang] = useState("");
  const [modalNhaVangList, setModalNhaVangList] = useState([]);
  const [donvi, setDonvi] = useState("luong"); // "luong" hoặc "kg"
  // ================= SELECT ACCOUNT MODAL =================
  const [showSelectAccountModal, setShowSelectAccountModal] = useState(false);
  const [selectAccountPasswordInput, setSelectAccountPasswordInput] = useState("");
  const [selectAccountPasswordError, setSelectAccountPasswordError] = useState("");
  const [pendingAccountSelection, setPendingAccountSelection] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectError, setSelectError] = useState("");

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchasePassword, setPurchasePassword] = useState("");
  const [purchasePasswordError, setPurchasePasswordError] = useState("");

  // ================= SEARCH ACCOUNT =================
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimer = useRef(null);

  /* ================= DATE ================= */
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    id_chungloai: "",
    loai: "VANG",
    soluong: 1,
    donvi: "luong",        // giữ để dễ quản lý
    ngaymua: getTodayDate(),
    gia_mua: "",
  });

  const toRad = (value) => (value * Math.PI) / 180;

  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // bán kính Trái Đất (km)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const fetchUserLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          long: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn("Không lấy được vị trí:", err.message);
        setUserLocation(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
      }
    );
  };


  useEffect(() => {
    if (!userLocation || !distanceKm || nhaVangList.length === 0) {
      setFilteredNhaVangList(nhaVangList);
      return;
    }

    const maxKm = Number(distanceKm);

    const filtered = nhaVangList.filter((nv) => {
      if (!nv.vitri_location) return false;

      try {
        const locations = JSON.parse(nv.vitri_location);
        if (!Array.isArray(locations)) return false;

        return locations.some((loc) => {
          const d = getDistanceKm(
            userLocation.lat,
            userLocation.long,
            loc.lat,
            loc.long
          );
          return d <= maxKm;
        });
      } catch {
        return false;
      }
    });

    setFilteredNhaVangList(filtered);
  }, [distanceKm, nhaVangList, userLocation]);

  /* ================= LOAD ACCOUNT ================= */
  useEffect(() => {
    const stored = localStorage.getItem("accountInfo");
    if (!stored) {
      navigate("/dang-ky-tai-khoan");
      return;
    }
    setAccountInfo(JSON.parse(stored));
    logUserInfo("Trang Mua vàng - Wallet.jsx");

    fetchUserLocation(); // ⭐ THÊM DÒNG NÀY
  }, [navigate]);


  /* ================= LOAD NHÀ VÀNG ================= */
  useEffect(() => {
    fetch("https://api_gold.thinkdiff.us/list_nha_vang")
      .then((res) => res.json())
      .then((data) => {
        let list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];

        // Lọc để chỉ giữ lại giá cao nhất cho mỗi tên nhà vàng
        const priceMap = {};
        list.forEach((item) => {
          const name = item.name_nhavang;
          const price = Number(item.gia_hien_tai) || 0;

          if (!priceMap[name] || price > priceMap[name].gia_hien_tai) {
            priceMap[name] = item;
          }
        });

        const filteredList = Object.values(priceMap);
        setNhaVangList(filteredList);
      })
      .catch(() => setNhaVangList([]));
  }, []);

  useEffect(() => {
    // 👉 Nếu chọn "ALL" hoặc chưa có location
    if (
      tempDistanceKm === "ALL" ||
      !userLocation ||
      nhaVangList.length === 0
    ) {
      setModalNhaVangList(nhaVangList);
      return;
    }

    const maxKm = Number(tempDistanceKm);

    const filtered = nhaVangList.filter((nv) => {
      if (!nv.vitri_location) return false;

      try {
        const locations = JSON.parse(nv.vitri_location);
        if (!Array.isArray(locations)) return false;

        return locations.some((loc) => {
          const d = getDistanceKm(
            userLocation.lat,
            userLocation.long,
            Number(loc.lat),
            Number(loc.long)
          );
          return d <= maxKm;
        });
      } catch {
        return false;
      }
    });

    setModalNhaVangList(filtered);
  }, [tempDistanceKm, nhaVangList, userLocation]);


  /* ================= LOAD HISTORY ================= */
  useEffect(() => {
    if (!accountInfo) return;
    const txKey = `transactions_${accountInfo.username}`;
    const stored = localStorage.getItem(txKey);
    if (stored) setTransactions(JSON.parse(stored));
    else setTransactions([]);
  }, [accountInfo]);

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "soluong" && value !== "") {
      // Cho phép số và dấu chấm (vì kg có thể thập phân)
      if (!/^\d*\.?\d*$/.test(value)) return;
    }

    if (name === "donvi") {
      setDonvi(value);
      setFormData(prev => ({ ...prev, donvi: value, soluong: value === "luong" ? 1 : 0.1 }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "id_chungloai") setSelectError("");
  };
  /* ================= SEARCH ACCOUNT ================= */
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
          `https://api_gold.thinkdiff.us/api/vi/find/${value}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();

        if (
          (data.status === "ok" || data.status === "success") &&
          data.data &&
          Array.isArray(data.data)
        ) {
          setSearchResults(data.data);
          setShowSearchResults(true);
        } else {
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } catch (err) {
        console.error("Lỗi tìm kiếm tài khoản:", err);
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  };

  /* ================= SELECT ACCOUNT FROM SEARCH ================= */
  const handleSelectSearchAccount = (account) => {
    setPendingAccountSelection(account);
    setShowSelectAccountModal(true);
    setSelectAccountPasswordInput("");
    setSelectAccountPasswordError("");
  };

  /* ================= CONFIRM SELECT ACCOUNT ================= */
  const handleConfirmSelectAccount = async () => {
    setSelectAccountPasswordError("");

    if (!selectAccountPasswordInput.trim()) {
      setSelectAccountPasswordError("Vui lòng nhập mật khẩu");
      return;
    }

    setLoading(true);
    try {
      const verifyUrl = `https://api_gold.thinkdiff.us/api/vi/${pendingAccountSelection.id_thongke_taikhoan}/VANG?password=${selectAccountPasswordInput}`;

      const response = await fetch(verifyUrl);

      if (response.ok) {
        // Mật khẩu đúng - cập nhật tài khoản
        const newAccountData = {
          email: pendingAccountSelection.email,
          username: pendingAccountSelection.id_thongke_taikhoan,
          id_taikhoan: pendingAccountSelection.id_thongke_taikhoan,
          id_thongke_taikhoan: pendingAccountSelection.id_thongke_taikhoan,
          password: selectAccountPasswordInput,
          ip_address: accountInfo?.ip_address || "",
        };
        setAccountInfo(newAccountData);
        localStorage.setItem("accountInfo", JSON.stringify(newAccountData));

        // Clear search
        setSearchInput("");
        setSearchResults([]);
        setShowSearchResults(false);

        // Close modal
        setShowSelectAccountModal(false);
        setPendingAccountSelection(null);
        setSelectAccountPasswordInput("");
      } else {
        setSelectAccountPasswordError("Mật khẩu không chính xác");
      }
    } catch (err) {
      setSelectAccountPasswordError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!formData.id_chungloai) {
      setSelectError(t("wallet.validation_select_gold"));
      return;
    }

    const soluongNum = Number(formData.soluong);
    if (isNaN(soluongNum) || soluongNum <= 0 || !formData.gia_mua) {
      setError(t("wallet.validation_invalid"));
      return;
    }

    // 👉 MỞ MODAL XÁC NHẬN MẬT KHẨU
    setPurchasePassword("");
    setPurchasePasswordError("");
    setShowPurchaseModal(true);
  };
  const handleConfirmPurchase = async () => {
    if (!purchasePassword.trim()) {
      setPurchasePasswordError(t("wallet.password_required"));
      return;
    }

    setLoading(true);
    setPurchasePasswordError("");

    try {
      // === BƯỚC 1: Kiểm tra mật khẩu trước ===
      const type = formData.loai || "VANG";

      const verifyUrl = `https://api_gold.thinkdiff.us/api/vi/${accountInfo.id_thongke_taikhoan}/${type}?password=${purchasePassword}`;

      const verifyRes = await fetch(verifyUrl);

      if (!verifyRes.ok) {
        setPurchasePasswordError(t("wallet.password_wrong"));
        return;
      }

      // === BƯỚC 2: Mật khẩu đúng → Gọi API mua thật ===
      await executePurchaseWithPassword(purchasePassword);

      setShowPurchaseModal(false);
      setPurchasePassword("");

    } catch (err) {
      console.error(err);
      setPurchasePasswordError(t("wallet.error_general"));
    } finally {
      setLoading(false);
    }
  };


  /* ================= EXECUTE PURCHASE ================= */
  const executePurchaseWithPassword = async (password) => {
    try {
      const fd = new FormData();
      fd.append("email", accountInfo.email || "");
      fd.append("id_taikhoan", accountInfo.username);
      fd.append("id_thongke_taikhoan", accountInfo.id_thongke_taikhoan);
      fd.append("password", password);                    // ← dùng password vừa nhập
      fd.append("id_chungloai", formData.id_chungloai);
      fd.append("loai", formData.loai);
      fd.append("soluong", Number(formData.soluong));
      fd.append("donvi", formData.donvi);                 // ← thêm đơn vị
      fd.append("ngaymua", formData.ngaymua);
      fd.append("gia_mua", Number(formData.gia_mua));
      fd.append("location", accountInfo.location || '{"lat":0,"long":0}');
      fd.append("ip_address", accountInfo.ip_address || "");

      const res = await fetch("https://api_gold.thinkdiff.us/api/vi/mua", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Mua thất bại");
      }

      // Lưu giao dịch vào localStorage
      const newTx = {
        ...data,
        vi_id: data.vi_id || Date.now(),
        donvi: formData.donvi,        // lưu thêm đơn vị
        soluong: Number(formData.soluong)
      };

      const txKey = `transactions_${accountInfo.username}`;
      const existing = JSON.parse(localStorage.getItem(txKey)) || [];
      const updated = [newTx, ...existing];

      localStorage.setItem(txKey, JSON.stringify(updated));
      setTransactions(updated);

      setSuccess(true);

      // Reset form
      setFormData({
        id_chungloai: "",
        loai: "VANG",
        soluong: 1,
        donvi: "luong",
        ngaymua: getTodayDate(),
        gia_mua: "",
      });

      setDonvi("luong");

    } catch (err) {
      console.error(err);
      setError(err.message || "Có lỗi khi thực hiện mua hàng");
    }
  };

  /* ================= NO ACCOUNT ================= */
  if (!accountInfo) return null;

  /* ================= RENDER ================= */
  return (
    <div className="wallet-container">
      <div className="wallet-card">
        <h1>{t("wallet.title")}</h1>

        {/* ================= SEARCH ACCOUNT ================= */}
        <div className="search-account-section" style={{ marginBottom: "30px", paddingBottom: "20px", borderBottom: "2px solid #f0f0f0" }}>
          <h3 style={{ marginBottom: "15px", color: "#FFD700" }}>{t("wallet.search_account")}</h3>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder={t("wallet.search_placeholder")}
              value={searchInput}
              onChange={handleSearchChange}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #ddd",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "10px",
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)",
                color: "yellow",
              }}
            />

            {searchLoading && (
              <p style={{ fontSize: "13px", color: "#666", marginTop: "5px" }}>{t("wallet.search_loading")}</p>
            )}

            {showSearchResults && searchResults.length > 0 && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "linear-gradient(135deg, #d6d632 0%, #FFD700 100%)",
                border: "1px solid #ddd",
                borderRadius: "8px",
                maxHeight: "300px",
                overflowY: "auto",
                zIndex: 100,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                marginTop: "5px"
              }}>
                {searchResults.map((acc, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSearchAccount(acc)}
                    style={{
                      padding: "12px",
                      borderBottom: idx < searchResults.length - 1 ? "1px solid #f0f0f0" : "none",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      backgroundColor: "#1e293b ",
                    }}

                  >
                    <div style={{ fontWeight: "600", color: "#ffd700", marginBottom: "3px" }}>
                      👤 {acc.id_thongke_taikhoan}
                    </div>
                    <div style={{ fontSize: "12px", color: "lightcoral" }}>
                      📧 {acc.email}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showSearchResults && searchResults.length === 0 && searchInput && !searchLoading && (
              <p style={{ fontSize: "13px", color: "#e74c3c", marginTop: "5px" }}>
                {t("wallet.search_not_found")}
              </p>
            )}
          </div>
        </div>

        {/* ================= CURRENT ACCOUNT ================= */}
        {accountInfo && (
          <div style={{
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
            borderLeft: "4px solid #FFD700",
            borderRight: "4px solid #FFD700",
          }}>
            <p style={{ margin: "0 0 5px 0", color: "#FFD700", fontSize: "15px" }}>
              <strong>{t("wallet.current_wallet")}</strong>
            </p>
            <p style={{ margin: "0", color: "lightgreen", fontSize: "15px", fontWeight: "500" }}>
              👤 {accountInfo.username}
            </p>
          </div>
        )}

        <h2 style={{ marginTop: "30px", marginBottom: "20px", color: "#FFD700" }}>{t("wallet.transaction_detail")}</h2>

        <form onSubmit={handleSubmit} className="wallet-form">
          <div className="form-group">
            <label className="form-label">{t("wallet.distance_label")}</label>

            <div
              onClick={() => {
                setTempDistanceKm(distanceKm);
                setTempSelectedNhaVang(formData.id_chungloai);
                setShowFilterModal(true);
              }}
              style={{
                padding: "12px",
                border: "2px solid #FFD700",
                borderRadius: "8px",
                cursor: "pointer",
                background: "#1a1a1a",
                color: "#FFD700",
              }}
            >
              {formData.id_chungloai
                ? `🏆 ${formData.id_chungloai} • ${distanceKm === "ALL" ? t("wallet.distance_world") : `${distanceKm} km`
                }`
                : t("wallet.distance_select")}
            </div>

            {selectError && <p className="error-text">{selectError}</p>}
          </div>


          <div className="form-group">
            <label className="form-label">{t("wallet.product_type")}</label>
            <select
              name="loai"
              value={formData.loai}
              onChange={handleChange}
            >
              <option value="VANG">{t("wallet.gold")}</option>
              <option value="BAC">{t("wallet.silver")}</option>
            </select>
          </div>

          {/* SỐ LƯỢNG + ĐƠN VỊ */}
          <div className="form-group">
            <label className="form-label">
              {t("wallet.quantity")} <span style={{ color: "#FFD700" }}>({donvi === "luong" ? "Lượng" : "Kilogram"})</span>
            </label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                name="soluong"
                value={formData.soluong}
                onChange={handleChange}
                placeholder={donvi === "luong" ? "Ví dụ: 1 hoặc 2" : "Ví dụ: 0.5 hoặc 1.25"}
                style={{ flex: 1 }}
              />

              <select
                name="donvi"
                value={donvi}
                onChange={handleChange}
                style={{
                  padding: "11px 12px",
                  border: "2px solid #FFD700",
                  borderRadius: "8px",
                  background: "#1a1a1a",
                  color: "#FFD700",
                  fontWeight: "600",
                  minWidth: "130px"
                }}
              >
                <option value="luong">Lượng</option>
                <option value="kg">Kilogram (kg)</option>
              </select>
            </div>
            <small style={{ color: "#aaa", marginTop: "4px", display: "block" }}>
              {donvi === "luong"
                ? "1 Lượng = 37.5 gram • Thường dùng cho vàng miếng"
                : "Nhập theo kg (có thể dùng số thập phân)"}
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">{t("wallet.date")}</label>
            <input
              type="date"
              name="ngaymua"
              value={formData.ngaymua}
              onChange={handleChange}
              className="date-input"
              onClick={(e) => {
                e.target.showPicker?.();
              }}
              onKeyDown={(e) => e.preventDefault()} // chặn gõ tay
            />
          </div>


          <div className="form-group">
            <label className="form-label">{t("wallet.price")}</label>
            <input
              type="number"
              name="gia_mua"
              value={formData.gia_mua}
              onChange={handleChange}
              placeholder={t("wallet.price_placeholder")}
              min="0"
            />
          </div>

          {error && <p className="error-text">❌ {error}</p>}
          {success && <p className="success-text">{t("wallet.success")}</p>}

          <button type="submit" className="purchase-btn" disabled={loading}>
            {loading ? t("wallet.processing") : t("wallet.buy_now")}
          </button>
        </form>
        <div className="button-group">
          <a
            href={`/#/vi/${accountInfo?.username}`}
            className="back-btn-custom"
          >
            {t("wallet.back")}
          </a>
          <a
            href="/#/dang-ky-tai-khoan"
            className="signup-btn-custom"
          >
            {t("wallet.create_wallet")}
          </a>
        </div>
      </div>

      {/* ================= SELECT ACCOUNT MODAL ================= */}
      {showSelectAccountModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }} onClick={() => {
          setShowSelectAccountModal(false);
          setPendingAccountSelection(null);
          setSelectAccountPasswordInput("");
          setSelectAccountPasswordError("");
        }}>
          <div style={{
            background: "#FFD700",
            borderRadius: "12px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            maxWidth: "400px",
            width: "90%",
            overflow: "hidden",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              background: "#FFD700",
              color: "white",
              padding: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#333", fontWeight: "600" }}>{t("wallet.select_account_title")}</h3>
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: "#333",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: 0,
                }}
                onClick={() => {
                  setShowSelectAccountModal(false);
                  setPendingAccountSelection(null);
                  setSelectAccountPasswordInput("");
                  setSelectAccountPasswordError("");
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              padding: "30px",
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            }}>
              <p style={{
                margin: "0 0 20px 0",
                color: "#FFD700",
                fontSize: "14px",
              }}>
                Tài khoản: <strong>{pendingAccountSelection?.id_thongke_taikhoan}</strong>
              </p>

              <input
                type="password"
                style={{
                  width: "100%",
                  padding: "12px 15px",
                  border: "2px solid #FFD700",
                  borderRadius: "8px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  marginBottom: "10px",
                  background: "#2a2a2a",
                  color: "#FFD700",
                }}
                placeholder={t("wallet.password_placeholder")}
                value={selectAccountPasswordInput}
                onChange={(e) => setSelectAccountPasswordInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleConfirmSelectAccount();
                  }
                }}
                disabled={loading}
                autoFocus
              />
              {selectAccountPasswordError && (
                <p style={{
                  color: "#ff6b6b",
                  fontSize: "13px",
                  margin: "0",
                  textAlign: "center",
                  marginBottom: "10px",
                }}>
                  {selectAccountPasswordError}
                </p>
              )}
            </div>

            <div style={{
              padding: "20px",
              display: "flex",
              gap: "10px",
              background: "#FFD700",
            }}>
              <button
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  background: "#ffffff",
                  color: "#333",
                  transition: "all 0.3s",
                }}
                onClick={() => {
                  setShowSelectAccountModal(false);
                  setPendingAccountSelection(null);
                  setSelectAccountPasswordInput("");
                  setSelectAccountPasswordError("");
                }}
                disabled={loading}
              >
                {t("wallet.close")}
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  color: "#FFD700",
                  transition: "all 0.3s",
                  opacity: loading ? 0.6 : 1,
                }}
                onClick={handleConfirmSelectAccount}
                disabled={loading}
              >
                {loading ? t("wallet.processing") : t("wallet.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PURCHASE CONFIRM MODAL ================= */}

      {showPurchaseModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setShowPurchaseModal(false);
            setPurchasePassword("");
            setPurchasePasswordError("");
          }}
        >
          <div
            style={{
              background: "#FFD700",
              borderRadius: "12px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              maxWidth: "400px",
              width: "90%",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ===== HEADER ===== */}
            <div
              style={{
                background: "#FFD700",
                color: "white",
                padding: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  color: "#333",
                  fontWeight: "600",
                }}
              >
                {t("wallet.confirm_buy_title")}
              </h3>
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: "#333",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: 0,
                }}
                onClick={() => {
                  setShowPurchaseModal(false);
                  setPurchasePassword("");
                  setPurchasePasswordError("");
                }}
              >
                ✕
              </button>
            </div>

            {/* ===== BODY ===== */}
            <div
              style={{
                padding: "30px",
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              }}
            >
              <p
                style={{
                  margin: "0 0 20px 0",
                  color: "#FFD700",
                  fontSize: "14px",
                }}
              >
                Tài khoản: <strong>{accountInfo?.username}</strong>
              </p>

              <input
                type="password"
                style={{
                  width: "100%",
                  padding: "12px 15px",
                  border: "2px solid #FFD700",
                  borderRadius: "8px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  marginBottom: "10px",
                  background: "#2a2a2a",
                  color: "#FFD700",
                }}
                placeholder="Nhập mật khẩu..."
                value={purchasePassword}
                onChange={(e) => setPurchasePassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleConfirmPurchase();
                  }
                }}
                disabled={loading}
                autoFocus
              />

              {purchasePasswordError && (
                <p
                  style={{
                    color: "#ff6b6b",
                    fontSize: "13px",
                    margin: "0",
                    textAlign: "center",
                    marginBottom: "10px",
                  }}
                >
                  {purchasePasswordError}
                </p>
              )}
            </div>

            {/* ===== FOOTER ===== */}
            <div
              style={{
                padding: "20px",
                display: "flex",
                gap: "10px",
                background: "#FFD700",
              }}
            >
              <button
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  background: "#ffffff",
                  color: "#333",
                  transition: "all 0.3s",
                }}
                onClick={() => {
                  setShowPurchaseModal(false);
                  setPurchasePassword("");
                  setPurchasePasswordError("");
                }}
                disabled={loading}
              >
                Đóng
              </button>

              <button
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  color: "#FFD700",
                  transition: "all 0.3s",
                  opacity: loading ? 0.6 : 1,
                }}
                onClick={handleConfirmPurchase}
                disabled={loading}
              >
                {loading ? t("wallet.processing") : t("wallet.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showFilterModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowFilterModal(false)}
        >
          <div
            style={{
              background: "#FFD700",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "450px",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div style={{ padding: "20px", fontWeight: "600", color: "#333" }}>
              {t("wallet.filter_title")}
            </div>

            {/* BODY */}
            <div style={{ padding: "20px", background: "#1a1a1a" }}>
              {/* KHOẢNG CÁCH */}
              <label style={{ color: "#FFD700", fontSize: "14px" }}>
                {t("wallet.distance")}
              </label>
              <select
                value={tempDistanceKm}
                onChange={(e) => setTempDistanceKm(e.target.value)}
                style={{ width: "100%", padding: "10px", marginBottom: "15px", border: "2px solid #FFD700", borderRadius: "8px", color: "#FFD700" }}
              >
                <option value="ALL">{t("editWallet.world")}</option>
                <option value="10">10 km</option>
                <option value="20">20 km</option>
                <option value="30">30 km</option>
                <option value="40">40 km</option>
                <option value="50">50 km</option>
                <option value="100">100 km</option>
              </select>

              {/* NHÀ VÀNG */}
              <label style={{ color: "#FFD700", fontSize: "14px" }}>
                {t("wallet.gold_shop_in_range")}
              </label>

              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {modalNhaVangList.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => setTempSelectedNhaVang(n.name_nhavang)}
                    style={{
                      padding: "10px",
                      marginBottom: "8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      background:
                        tempSelectedNhaVang === n.name_nhavang
                          ? "#FFD700"
                          : "#2a2a2a",
                      color:
                        tempSelectedNhaVang === n.name_nhavang
                          ? "#333"
                          : "#FFD700",
                    }}
                  >
                    🏆 {n.name_nhavang}
                  </div>
                ))}
              </div>
            </div>

            {/* FOOTER */}
            <div style={{ padding: "15px", display: "flex", gap: "10px" }}>
              <button
                style={{
                  flex: 1, padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  background: "gray",
                  color: "#FFD700",
                  transition: "all 0.3s",
                }}
                onClick={() => setShowFilterModal(false)}
              >
                Đóng
              </button>

              <button
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  background: "#333",
                  color: "#FFD700",
                  transition: "all 0.3s",
                }}
                onClick={() => {
                  setDistanceKm(tempDistanceKm);
                  setFormData((p) => ({
                    ...p,
                    id_chungloai: tempSelectedNhaVang,
                  }));
                  setSelectError("");
                  setShowFilterModal(false);
                }}
              >
                {t("wallet.apply")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Wallet;
