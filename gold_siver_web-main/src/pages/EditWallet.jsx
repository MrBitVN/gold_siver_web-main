import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import "./EditWallet.css";
import { logUserInfo } from "../utils/logUserInfo";
import { useTranslation } from "react-i18next";
const normalizeDate = (dateStr) => {
  if (!dateStr) return "";

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  return d.toISOString().slice(0, 10);
};
const EditWallet = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const stateData = location.state || {};

  /* ================= STATE ================= */
  const [accountInfo, setAccountInfo] = useState(null);
  const [nhaVangList, setNhaVangList] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [form, setForm] = useState({
    vi_id: searchParams.get("vi_id") || "",
    id_chungloai: stateData.id_chungloai || "",
    gia_mua: stateData.gia_mua || "",
    soluong: stateData.soluong || "",
    loai_san_pham: stateData.loai_san_pham || "VANG",
    ngaymua: normalizeDate(stateData.ngaymua),
    khoang_cach: stateData.khoang_cach || 20,
  });
  const [tempDistanceKm, setTempDistanceKm] = useState(
    String(form.khoang_cach || 20)
  );

  const [tempSelectedNhaVang, setTempSelectedNhaVang] = useState(
    form.id_chungloai || ""
  );

  const [modalNhaVangList, setModalNhaVangList] = useState([]);
  const fetchUserLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          long: pos.coords.longitude,
        });
      },
      () => {
        setUserLocation(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
      }
    );
  };

  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
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


  const originalNhaVang = stateData.id_chungloai || "";
  useEffect(() => {
    logUserInfo("Trang Chỉnh sửa ví - EditWallet.jsx");
  }, []);




  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          long: pos.coords.longitude,
        });
      },
      () => setUserLocation(null),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  /* ===== MODAL PASSWORD ===== */
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const stored = localStorage.getItem("accountInfo");
    if (stored) setAccountInfo(JSON.parse(stored));
  }, []);

  useEffect(() => {
    fetch("https://api_gold.thinkdiff.us/list_nha_vang")
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.data || [];
        setNhaVangList(list);
      });
  }, []);

  const currentNhaVangName =
    nhaVangList.find(nv => nv.name_nhavang === originalNhaVang)?.name_nhavang ||
    originalNhaVang;

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.id_chungloai) return "Vui lòng chọn nhà vàng";
    if (!form.soluong || Number(form.soluong) <= 0) return "Số lượng không hợp lệ";
    if (!form.gia_mua || Number(form.gia_mua) <= 0) return "Giá mua không hợp lệ";
    if (!form.ngaymua) return "Vui lòng chọn ngày mua";
    return null;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setShowPasswordModal(true);
  };

  const handlePasswordConfirm = async () => {
    if (!passwordInput) {
      setPasswordError("Vui lòng nhập mật khẩu");
      return;
    }

    setPasswordLoading(true);
    setPasswordError("");

    try {
      const fd = new FormData();
      fd.append("vi_id", form.vi_id);
      fd.append("id_taikhoan", accountInfo.id_thongke_taikhoan);
      fd.append("password", passwordInput);
      fd.append("soluong", form.soluong);
      fd.append("gia_mua", form.gia_mua);
      fd.append("id_chungloai", form.id_chungloai);
      fd.append("loai_san_pham", form.loai_san_pham);
      fd.append("ngaymua", form.ngaymua);
      fd.append("location", accountInfo.location || '{"lat":0,"long":0}');

      const res = await fetch(
        `https://api_gold.thinkdiff.us/api/vi/sua/${form.vi_id}`,
        { method: "POST", body: fd }
      );

      const data = await res.json();

      if (!res.ok || data.status === "error") {
        setPasswordError(data.message || "Mật khẩu không đúng");
        return;
      }

      setSuccess("✔️ Cập nhật ví thành công");
      setShowPasswordModal(false);
      setTimeout(() => navigate(`/vi/${username}`), 800);
    } catch {
      setPasswordError("Lỗi kết nối server");
    } finally {
      setPasswordLoading(false);
    }
  };
  /* ================= UI ================= */
  return (
    <div className="gold-page">
      <div className="gold-card">
        <h1>✏️ {t("editWallet.title")}  - {currentNhaVangName}</h1>

        <form onSubmit={handleSubmit} className="gold-form">
          <div className="gold-field">
            <label>{t("editWallet.walletId")}</label>
            <input value={form.vi_id} disabled />
          </div>
          <div className="gold-field">
            <label>{t("editWallet.distanceAndShop")}</label>
          </div>
          <div
            onClick={() => {
              setTempDistanceKm(String(form.khoang_cach || 20));
              setTempSelectedNhaVang(form.id_chungloai);
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
            {form.id_chungloai
              ? `🏆 ${form.id_chungloai} • ${form.khoang_cach === "ALL"
                ? t("editWallet.world")
                : `${form.khoang_cach} km`
              }`
              : `📍 ${t("editWallet.selectDistance")}`}
          </div>



          {form.id_chungloai !== originalNhaVang && (
            <div className="gold-warning">⚠️ {t("editWallet.changeWarning")}</div>
          )}

          <div className="gold-field">
            <label>{t("editWallet.quantity")}</label>
            <input type="number" name="soluong" value={form.soluong} onChange={handleChange} />
          </div>

          <div className="gold-field">
            <label>{t("editWallet.productType")}</label>
            <select
              name="loai_san_pham"
              value={form.loai_san_pham}
              onChange={handleChange}
            >
              <option value="VANG">{t("productType.VANG")}</option>
              <option value="BAC">{t("productType.BAC")}</option>
            </select>
          </div>

          <div className="gold-field">
            <label>{t("editWallet.price")}</label>
            <input type="number" name="gia_mua" value={form.gia_mua} onChange={handleChange} />
          </div>

          <div className="gold-field">
            <label>{t("editWallet.date")}</label>
            <input
              type="date"
              name="ngaymua"
              value={form.ngaymua}
              onChange={handleChange}
              onClick={(e) => {
                e.target.showPicker?.();
              }}
              onKeyDown={(e) => e.preventDefault()} // 🚫 chặn gõ tay
            />
          </div>

          {error && <div className="gold-error">⚠️ {error}</div>}
          {success && <div className="gold-success">{success}</div>}

          <div className="gold-actions">
            <button type="button" onClick={() => navigate(-1)}>{t("editWallet.cancel")}</button>
            <button type="submit" disabled={loading}>{t("editWallet.confirm")}</button>
          </div>
        </form>
      </div>

      {/* ===== PASSWORD MODAL (GIỮ NGUYÊN STYLE CỦA BẠN) ===== */}
      {showPasswordModal && (
        <div className="modal-overlay" style={{
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
        }} onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" style={{
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
              <h3 style={{ margin: 0, fontSize: "18px", color: "#333", fontWeight: "600" }}>🔐 {t("editWallet.passwordTitle")}</h3>
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: "#333",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: 0,
                  textAlign: "right",
                }}
                onClick={() => setShowPasswordModal(false)}
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
                {t("editWallet.account")} <strong>{username}</strong>
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
                placeholder={t("editWallet.passwordPlaceholder")}
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
                <p style={{
                  color: "#ff6b6b",
                  fontSize: "13px",
                  margin: "0",
                  textAlign: "center",
                  marginBottom: "10px",
                }}>
                  {passwordError}
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
                onClick={() => setShowPasswordModal(false)}
                disabled={passwordLoading}
              >
                Hủy
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
                  opacity: passwordLoading ? 0.6 : 1,
                }}
                onClick={handlePasswordConfirm}
                disabled={passwordLoading}
              >
                {passwordLoading ? `⏳ ${t("editWallet.processing")}` : `✓ ${t("editWallet.confirm")}`}
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
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFilterModal(false);
            }
          }}
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
            <div style={{ padding: "20px", fontWeight: 600 }}>
              📍 {t("editWallet.distanceAndShop")}
            </div>

            {/* BODY */}
            <div style={{
              padding: "20px", background: "#1a1a1a", maxHeight: "300px",          // ⭐ QUAN TRỌNG
              overflowY: "auto",
              marginTop: "8px",
            }}>
              <label style={{ color: "#FFD700" }}>{t("editWallet.distance")}</label>
              <select
                value={tempDistanceKm}
                onChange={(e) => setTempDistanceKm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  border: "2px solid #FFD700",
                  borderRadius: "8px",
                  color: "#FFD700",
                  background: "#000",
                }}
              >
                <option value="ALL">{t("editWallet.world")}</option>
                <option value="10">10 km</option>
                <option value="20">20 km</option>
                <option value="30">30 km</option>
                <option value="40">40 km</option>
                <option value="50">50 km</option>
                <option value="100">100 km</option>
              </select>

              {modalNhaVangList.map((nv) => (
                <div
                  key={nv.id}
                  onClick={() => setTempSelectedNhaVang(nv.name_nhavang)}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    marginBottom: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    background:
                      tempSelectedNhaVang === nv.name_nhavang
                        ? "#FFD700"
                        : "#2a2a2a",
                    color:
                      tempSelectedNhaVang === nv.name_nhavang
                        ? "#333"
                        : "#FFD700",
                  }}
                >
                  🏪 {nv.name_nhavang}
                </div>
              ))}
            </div>

            {/* FOOTER */}
            <div style={{ display: "flex", padding: "15px", gap: "10px" }}>
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
                {t("editWallet.cancel")}
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
                  setForm((prev) => ({
                    ...prev,
                    khoang_cach: tempDistanceKm,
                    id_chungloai: tempSelectedNhaVang,
                  }));
                  setShowFilterModal(false);
                }}
              >
                {t("editWallet.apply")}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default EditWallet;
