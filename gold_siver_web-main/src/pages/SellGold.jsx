import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "./Wallet.css";
import { logUserInfo } from "../utils/logUserInfo";
import { useTranslation } from "react-i18next";

const SellGold = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { username } = useParams();
    const [searchParams] = useSearchParams();
    const productIdFromUrl = searchParams.get("id") || "";
    const typeFromUrl = searchParams.get("type") || "VANG"; // Default to VANG if not specified

    /* ================= STATE ================= */
    const [accountInfo, setAccountInfo] = useState(null);
    const [ownedProducts, setOwnedProducts] = useState([]); // Danh sách vàng đã mua
    const [selectedProduct, setSelectedProduct] = useState(null); // Sản phẩm được chọn
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState(typeFromUrl); // VANG hoặc BAC dựa trên URL

    // ================= SELECT ACCOUNT MODAL =================
    const [showSelectAccountModal, setShowSelectAccountModal] = useState(false);
    const [selectAccountPasswordInput, setSelectAccountPasswordInput] = useState("");
    const [selectAccountPasswordError, setSelectAccountPasswordError] = useState("");
    const [pendingAccountSelection, setPendingAccountSelection] = useState(null);

    // ================= SELL MODAL =================
    const [showSellModal, setShowSellModal] = useState(false);
    const [sellPassword, setSellPassword] = useState("");
    const [sellPasswordError, setSellPasswordError] = useState("");

    // ================= QUANTITY VALIDATION =================
    const [quantityError, setQuantityError] = useState("");

    // ================= SUCCESS MODAL =================
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [sellUnit, setSellUnit] = useState("luong");
    const [submittedPrice, setSubmittedPrice] = useState("");
    /* ================= DATE ================= */
    const getTodayDate = () => new Date().toISOString().split("T")[0];

    const [formData, setFormData] = useState({
        id: "", // ID ví
        vi_id: "", // ID sản phẩm được chọn
        ngay_ban: getTodayDate(), // Ngày bán
        so_luong_ban: "", // Số lượng muốn bán
        tongtien_thuve: "", // Tổng giá bán thu về
    });

    /* ================= LOAD ACCOUNT ================= */
    useEffect(() => {
        const stored = localStorage.getItem("accountInfo");
        if (!stored) {
            navigate("/#/dang-ky-tai-khoan");
            return;
        }
        const accountData = JSON.parse(stored);

        // Kiểm tra username từ URL có khớp với localStorage không
        if (username && accountData.username !== username) {
            navigate("/#/dang-ky-tai-khoan");
            return;
        }

        setAccountInfo(accountData);
        logUserInfo("Trang Bán vàng - SellGold.jsx");

        // Load danh sách sản phẩm đã mua
        fetchOwnedProducts(accountData, activeTab);

        // Reset form khi chuyển tab
        setSelectedProduct(null);
        setFormData({
            id: "",
            vi_id: "",
            ngay_ban: getTodayDate(),
            so_luong_ban: "",
            tongtien_thuve: "",
        });
        setQuantityError("");
    }, [navigate, username, activeTab]);

    /* ================= SYNC ACTIVE TAB FROM URL ================= */
    useEffect(() => {
        setActiveTab(typeFromUrl);
    }, [typeFromUrl]);

    /* ================= FETCH OWNED PRODUCTS ================= */
    const fetchOwnedProducts = async (info, type = activeTab) => {
        try {
            setLoading(true);
            setError("");

            // Lấy dữ liệu từ API để kiểm tra sản phẩm đã mua
            const url = `https://api_gold.thinkdiff.us/api/vi/${info.id_thongke_taikhoan}/${type}?password=${info.password}`;

            const response = await fetch(url);

            if (!response.ok) {
                setError(`Lỗi API: ${response.status}`);
                return;
            }

            const data = await response.json();

            if (data.status === "success" && data.data) {
                const txKey = `transactions_${info.username}`;
                const localTx = JSON.parse(localStorage.getItem(txKey)) || [];

                const products = data.data.map(item => {
                    const found = localTx.find(tx =>
                        String(tx.vi_id) === String(item.id) ||
                        String(tx.id) === String(item.id)
                    );
                    return {
                        id: item.id,
                        vi_id: item.id,
                        chung_loai: item.id_chungloai,
                        loai: item.loai_san_pham,
                        gia_mua: item.gia_mua,
                        soluong: item.soluong,
                        ngay_mua: item.ngaymua,
                        donvi: found?.donvi ?? "luong"
                    };
                });

                setOwnedProducts(products);

                // Nếu có ID từ URL, tìm và select sản phẩm đó
                if (productIdFromUrl) {
                    const productToSelect = products.find(p => String(p.id) === String(productIdFromUrl));
                    if (productToSelect) {
                        setSellUnit(productToSelect.donvi || "luong");
                        setSelectedProduct(productToSelect);
                        setFormData(prev => ({
                            ...prev,
                            id: productToSelect.id,
                            vi_id: productToSelect.vi_id,
                            so_luong_ban: productToSelect.soluong
                        }));
                    } else {
                        // Nếu không tìm thấy, select sản phẩm đầu tiên
                        if (products.length > 0) {
                            setSelectedProduct(products[0]);
                            setFormData(prev => ({
                                ...prev,
                                id: products[0].id,
                                vi_id: products[0].vi_id,
                                so_luong_ban: products[0].soluong
                            }));
                        }
                    }
                } else {
                    // Nếu không có ID từ URL, select sản phẩm đầu tiên
                    if (products.length > 0) {
                        setSelectedProduct(products[0]);
                        setFormData(prev => ({
                            ...prev,
                            id: products[0].id,
                            vi_id: products[0].vi_id,
                            so_luong_ban: products[0].soluong
                        }));
                    }
                }
            } else {
                setError("Không có dữ liệu sản phẩm");
            }
        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Có lỗi xảy ra khi tải dữ liệu sản phẩm");
        } finally {
            setLoading(false);
        }
    };

    /* ================= HANDLE CHANGE ================= */
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "so_luong_ban" && value !== "") {
            if (isNaN(Number(value)) || Number(value) < 0) {
                return;
            }
            // Kiểm tra không vượt quá số lượng có sẵn
            if (selectedProduct) {
                let inputValue = convertToBaseUnit(value, sellUnit, selectedProduct.donvi);
                let maxValue = Number(selectedProduct.soluong);

                if (inputValue > maxValue) {
                    setQuantityError(
                        `Không được vượt quá ${maxValue} ${selectedProduct.donvi}`
                    );
                } else {
                    setQuantityError("");
                }
            } else {
                setQuantityError("");
            }
        }

        if (name === "tongtien_thuve" && value !== "") {
            if (isNaN(Number(value)) || Number(value) < 0) {
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === "vi_id") {
            const product = ownedProducts.find(p => p.vi_id == value);
            setSelectedProduct(product);
            if (product) {
                setSellUnit(product.donvi || "luong");
                setFormData(prev => ({
                    ...prev,
                    id: product.id,
                    so_luong_ban: product.soluong  // Auto-fill với số lượng tối đa
                }));
                setQuantityError(""); // Clear error khi chọn sản phẩm mới
            }
        }
    };

    /* ================= SEARCH ACCOUNT ================= */
    /* ================= SELECT ACCOUNT FROM SEARCH ================= */
    const handleSelectSearchAccount = (account) => {
        setPendingAccountSelection(account);
        setShowSelectAccountModal(true);
        setSelectAccountPasswordInput("");
        setSelectAccountPasswordError("");
        setShowSearchResults(false);
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
            // Kiểm tra mật khẩu bằng cách fetch dữ liệu với token mật khẩu
            const verifyUrl = `https://api_gold.thinkdiff.us/api/vi/${pendingAccountSelection.id_thongke_taikhoan}/${activeTab}?password=${selectAccountPasswordInput}`;
            const verifyRes = await fetch(verifyUrl);

            if (!verifyRes.ok) {
                setSelectAccountPasswordError("Mật khẩu không chính xác");
                return;
            }

            // Cập nhật thông tin tài khoản
            const newAccountInfo = {
                ...accountInfo,
                username: pendingAccountSelection.id_thongke_taikhoan,
                email: pendingAccountSelection.email,
                password: selectAccountPasswordInput,
            };

            localStorage.setItem("accountInfo", JSON.stringify(newAccountInfo));
            setAccountInfo(newAccountInfo);
            setShowSelectAccountModal(false);
            setSearchInput("");
            setSearchResults([]);
            setShowSearchResults(false);

            // Reload sản phẩm cho tài khoản mới
            fetchOwnedProducts(newAccountInfo, activeTab);
        } catch (err) {
            console.error(err);
            setSelectAccountPasswordError("Lỗi xác thực tài khoản");
        } finally {
            setLoading(false);
        }
    };

    /* ================= SUBMIT ================= */
    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (!formData.vi_id) {
            setError("Vui lòng chọn sản phẩm");
            return;
        }

        let soLuongInput = Number(formData.so_luong_ban);

        if (isNaN(soLuongInput) || soLuongInput <= 0) {
            setError("Số lượng bán không hợp lệ");
            return;
        }

        if (quantityError) {
            setError("Số lượng vượt quá số lượng có sẵn");
            return;
        }

        let soLuongThuc = convertToBaseUnit(
            soLuongInput,
            sellUnit,
            selectedProduct?.donvi
        );

        let maxSoLuong = Number(selectedProduct?.soluong); // 👈 THÊM DÒNG NÀY

        if (selectedProduct && soLuongThuc > maxSoLuong) {
            setError(`Số lượng bán không được vượt quá ${maxSoLuong} ${selectedProduct.donvi}`);
            return;
        }

        const giaNum = Number(formData.tongtien_thuve);
        if (isNaN(giaNum) || giaNum <= 0) {
            setError("Giá bán không hợp lệ");
            return;
        }

        // 👉 MỞ MODAL XÁC NHẬN MẬT KHẨU
        setSellPassword("");
        setSellPasswordError("");
        setShowSellModal(true);
    };

    const handleConfirmSell = async () => {
        if (!sellPassword.trim()) {
            setSellPasswordError("Vui lòng nhập mật khẩu");
            return;
        }

        setLoading(true);
        setSellPasswordError("");

        try {
            // === BƯỚC 1: Kiểm tra mật khẩu trước ===
            const verifyUrl = `https://api_gold.thinkdiff.us/api/vi/${accountInfo.id_thongke_taikhoan}/${activeTab}?password=${sellPassword}`;
            const verifyRes = await fetch(verifyUrl);

            if (!verifyRes.ok) {
                setSellPasswordError("Mật khẩu không chính xác");
                return;
            }

            // === BƯỚC 2: Mật khẩu đúng → Gọi API bán thật ===
            await executeSellWithPassword(sellPassword);

            setShowSellModal(false);
            setSellPassword("");

        } catch (err) {
            console.error(err);
            setSellPasswordError("Lỗi xác thực mật khẩu");
        } finally {
            setLoading(false);
        }
    };

    /* ================= EXECUTE SELL ================= */
    const executeSellWithPassword = async (password) => {
        let soLuongBan = convertToBaseUnit(
            formData.so_luong_ban,
            sellUnit,
            selectedProduct?.donvi
        );

        // tránh lỗi float
        soLuongBan = Number(soLuongBan.toFixed(4));
        try {
            const fd = new FormData();
            setSubmittedPrice(formData.tongtien_thuve);
            fd.append("email", accountInfo.email || "");
            fd.append("id_taikhoan", accountInfo.username);
            fd.append("id_thongke_taikhoan", accountInfo.id_thongke_taikhoan);
            fd.append("password", password);
            fd.append("id", formData.id || "");
            fd.append("vi_id", formData.vi_id || "");
            fd.append("ngay_ban", formData.ngay_ban);
            fd.append("tongtien_thuve", Number(formData.tongtien_thuve));
            fd.append("so_luong_ban", soLuongBan);
            fd.append("so_luong", soLuongBan);
            fd.append("location", accountInfo.location || '{"lat":0,"long":0}');
            fd.append("ip_address", accountInfo.ip_address || "");

            const res = await fetch("https://api_gold.thinkdiff.us/api/vi/ban_chot_loi", {
                method: "POST",
                body: fd,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Chốt lời thất bại");
            }

            // ✅ SUCCESS
            setSuccessData(data);
            setShowSuccessModal(true);

            setFormData(prev => ({
                ...prev,
                so_luong_ban: "",
                tongtien_thuve: ""
            }));

            setQuantityError("");


        } catch (err) {
            console.error(err);
            setError(err.message || "Có lỗi khi thực hiện bán hàng");
        }
    };
    const convertToLuong = (value, unit) => {
        if (unit === "kg") return (value / 0.0375).toFixed(2);
        return value;
    };
    const convertToBaseUnit = (value, fromUnit, toUnit) => {
        if (!value) return 0;

        const num = Number(value);

        if (fromUnit === toUnit) return num;

        if (fromUnit === "luong" && toUnit === "kg") {
            return num * 0.0375;
        }

        if (fromUnit === "kg" && toUnit === "luong") {
            return num / 0.0375;
        }

        return num;
    };
    const baseUnit = selectedProduct?.donvi || "luong";
    /* ================= NO ACCOUNT ================= */
    if (!accountInfo) return null;

    /* ================= RENDER ================= */
    return (
        <div className="wallet-container">
            <div className="wallet-card">
                <h1>💰 Chốt Lời Vàng/Bạc</h1>


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
                            <strong>Tài khoản hiện tại</strong>
                        </p>
                        <p style={{ margin: "0", color: "lightgreen", fontSize: "15px", fontWeight: "500" }}>
                            👤 {accountInfo.username}
                        </p>
                    </div>
                )}

                <h2 style={{ marginTop: "30px", marginBottom: "20px", color: "#FFD700" }}>📋 Thông tin chốt lời</h2>

                {/* ================= VANG / BAC TABS ================= */}
                <div style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "20px",
                    alignItems: "center"
                }}>
                    <button
                        onClick={() => navigate(`/wallet-sell/${username}/bcl?id=${productIdFromUrl}&type=VANG`, { replace: true })}
                        type="button"
                        style={{
                            padding: "10px 20px",
                            background: activeTab === "VANG" ? "#FFD700" : "#333",
                            color: activeTab === "VANG" ? "#000" : "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                            transition: "all 0.3s",
                            fontSize: "14px"
                        }}
                    >
                        🟡 Vàng (VANG)
                    </button>

                    <button
                        onClick={() => navigate(`/wallet-sell/${username}/bcl?id=${productIdFromUrl}&type=BAC`, { replace: true })}
                        type="button"
                        style={{
                            padding: "10px 20px",
                            background: activeTab === "BAC" ? "#FFD700" : "#333",
                            color: activeTab === "BAC" ? "#000" : "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                            transition: "all 0.3s",
                            fontSize: "14px"
                        }}
                    >
                        ⚪ Bạc (BAC)
                    </button>
                </div>

                {loading && ownedProducts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#FFD700" }}>
                        <p>Đang tải dữ liệu sản phẩm...</p>
                    </div>
                ) : ownedProducts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#ff6b6b" }}>
                        <p>🚫 Bạn chưa có sản phẩm {activeTab === "VANG" ? "vàng" : "bạc"} nào để bán</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="wallet-form">
                        <div className="form-group">
                            <label className="form-label">🏆 Chon sản phẩm để bán</label>
                            <select
                                name="vi_id"
                                value={formData.vi_id}
                                onChange={handleChange}
                                style={{
                                    padding: "14px 16px",
                                    border: "2px solid #FFD700",
                                    borderRadius: "8px",
                                    fontSize: "15px",
                                    background: "#1a1a1a",
                                    color: "#FFD700",
                                    fontWeight: "600",
                                }}
                            >
                                <option value="">-- Chọn sản phẩm --</option>
                                {ownedProducts.map((product) => (
                                    <option key={product.vi_id} value={product.vi_id}>
                                        [ID: {product.id}] {product.chung_loai} - {product.donvi === "kg"
                                            ? `${product.soluong} kg`
                                            : `${convertToLuong(product.soluong, product.donvi)} lượng`}- Giá mua: {Number(product.gia_mua).toLocaleString("vi-VN")} VND
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* ================= DISPLAY SELECTED PRODUCT INFO ================= */}
                        {selectedProduct && (
                            <div style={{
                                background: "linear-gradient(135deg, #2d3748 0%, #1a202c 100%)",
                                border: "2px solid #FFD700",
                                borderRadius: "12px",
                                padding: "20px",
                                marginBottom: "20px",
                            }}>
                                <h3 style={{ margin: "0 0 15px 0", color: "#FFD700" }}>📦 Thông tin sản phẩm (chỉ đọc)</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", color: "#e0e0e0" }}>
                                    <div>
                                        <p style={{ margin: "0 0 3px 0", color: "#888", fontSize: "12px" }}>🆔 ID Ví</p>
                                        <p style={{ margin: "0", fontSize: "16px", fontWeight: "600", color: "#ffd700" }}>{selectedProduct.id}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: "0 0 3px 0", color: "#888", fontSize: "12px" }}>Tên sản phẩm</p>
                                        <p style={{ margin: "0", fontSize: "16px", fontWeight: "600" }}>{selectedProduct.chung_loai}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: "0 0 3px 0", color: "#888", fontSize: "12px" }}>Loại</p>
                                        <p style={{ margin: "0", fontSize: "16px", fontWeight: "600" }}>{selectedProduct.loai}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: "0 0 3px 0", color: "#888", fontSize: "12px" }}>Số lượng</p>
                                        <p style={{ margin: "0", fontSize: "16px", fontWeight: "600" }}>{selectedProduct.donvi === "kg"
                                            ? `${selectedProduct.soluong} kg`
                                            : `${convertToLuong(selectedProduct.soluong, selectedProduct.donvi)} lượng`}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: "0 0 3px 0", color: "#888", fontSqize: "12px" }}>Giá mua</p>
                                        <p style={{ margin: "0", fontSize: "16px", fontWeight: "600", color: "#88d9ff" }}>{Number(selectedProduct.gia_mua).toLocaleString("vi-VN")} VND</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: "0 0 3px 0", color: "#888", fontSize: "12px" }}>Ngày mua</p>
                                        <p style={{ margin: "0", fontSize: "16px", fontWeight: "600" }}>{selectedProduct.ngay_mua}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================= SELL FORM ================= */}
                        <div className="form-group">
                            <label className="form-label">📅 Ngày bán</label>
                            <input
                                type="date"
                                name="ngay_ban"
                                value={formData.ngay_ban}
                                onChange={handleChange}
                                className="date-input"
                                onClick={(e) => {
                                    e.target.showPicker?.();
                                }}
                                onKeyDown={(e) => e.preventDefault()}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Số lượng muốn bán ({sellUnit === "kg" ? "kg" : "Lượng"})
                            </label>

                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>

                                <input
                                    type="number"
                                    name="so_luong_ban"
                                    value={formData.so_luong_ban}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    style={{
                                        flex: 1,
                                        padding: "14px",
                                        border: "2px solid #FFD700",
                                        borderRadius: "8px",
                                        background: "#1a1a1a",
                                        color: "#FFD700",
                                    }}
                                />

                                {/* 🔥 DROPDOWN ĐƠN VỊ */}
                                <select
                                    value={sellUnit}
                                    onChange={(e) => {
                                        const newUnit = e.target.value;

                                        let currentValue = Number(formData.so_luong_ban);
                                        if (!currentValue) {
                                            setSellUnit(newUnit);
                                            return;
                                        }

                                        let convertedValue = currentValue;

                                        // 🔥 chuyển đổi khi đổi đơn vị
                                        if (sellUnit === "kg" && newUnit === "luong") {
                                            convertedValue = currentValue * 26.6667;
                                        }

                                        if (sellUnit === "luong" && newUnit === "kg") {
                                            convertedValue = currentValue / 26.6667;
                                        }

                                        setSellUnit(newUnit);

                                        setFormData(prev => ({
                                            ...prev,
                                            so_luong_ban: Number(convertedValue.toFixed(4))
                                        }));
                                    }}
                                    style={{
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: "2px solid #FFD700",
                                        background: "#1a1a1a",
                                        color: "#FFD700",
                                        fontWeight: "600"
                                    }}
                                >
                                    <option value="luong">Lượng</option>
                                    <option value="kg">kg</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">�💵 Tổng giá bán thu về (VND)</label>
                            <input
                                type="number"
                                name="tongtien_thuve"
                                value={formData.tongtien_thuve}
                                onChange={handleChange}
                                placeholder="Nhập tổng giá bán..."
                                min="0"
                                style={{
                                    padding: "14px 16px",
                                    border: "2px solid #FFD700",
                                    borderRadius: "8px",
                                    fontSize: "16px",
                                    background: "#1a1a1a",
                                    color: "#FFD700",
                                }}
                            />
                        </div>

                        {error && <p className="error-text">❌ {error}</p>}
                        {success && <p className="success-text">✅ Chốt lời thành công!</p>}

                        <button type="submit" className="purchase-btn" disabled={loading}>
                            {loading ? "Đang xử lý..." : "🎯 Chốt lời"}
                        </button>
                    </form>
                )}

                <div className="button-group" style={{ marginTop: "30px", display: "flex", gap: "10px" }}>
                    <a
                        href={`/#/vi/${accountInfo?.username}`}
                        className="back-btn-custom"
                        style={{
                            flex: 1,
                            padding: "12px",
                            textAlign: "center",
                            background: "#4b5563",
                            color: "#fff",
                            borderRadius: "8px",
                            textDecoration: "none",
                            fontWeight: "600",
                        }}
                    >
                        ← Quay lại
                    </a>
                    <a
                        href="/#/dang-ky-tai-khoan"
                        className="signup-btn-custom"
                        style={{
                            flex: 1,
                            padding: "12px",
                            textAlign: "center",
                            background: "#FFD700",
                            color: "#000",
                            borderRadius: "8px",
                            textDecoration: "none",
                            fontWeight: "600",
                        }}
                    >
                        + Tạo tài khoản
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
                            <h3 style={{ margin: 0, fontSize: "18px", color: "#333", fontWeight: "600" }}>Xác nhận tài khoản</h3>
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
                                placeholder="Nhập mật khẩu..."
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
                                onClick={handleConfirmSelectAccount}
                                disabled={loading}
                            >
                                {loading ? "Xử lý..." : "Xác nhận"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= SELL CONFIRM MODAL ================= */}
            {showSellModal && (
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
                        setShowSellModal(false);
                        setSellPassword("");
                        setSellPasswordError("");
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
                                Xác nhận chốt lời
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
                                    setShowSellModal(false);
                                    setSellPassword("");
                                    setSellPasswordError("");
                                }}
                            >
                                ✕
                            </button>
                        </div>

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
                                value={sellPassword}
                                onChange={(e) => setSellPassword(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleConfirmSell();
                                    }
                                }}
                                disabled={loading}
                                autoFocus
                            />

                            {sellPasswordError && (
                                <p
                                    style={{
                                        color: "#ff6b6b",
                                        fontSize: "13px",
                                        margin: "0",
                                        textAlign: "center",
                                        marginBottom: "10px",
                                    }}
                                >
                                    {sellPasswordError}
                                </p>
                            )}
                        </div>

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
                                    setShowSellModal(false);
                                    setSellPassword("");
                                    setSellPasswordError("");
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
                                onClick={handleConfirmSell}
                                disabled={loading}
                            >
                                {loading ? "Xử lý..." : "Xác nhận"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= SUCCESS MODAL ================= */}

            {showSuccessModal && successData && (
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
                    onClick={() => setShowSuccessModal(false)}
                >
                    <div
                        style={{
                            background: "#FFD700",
                            borderRadius: "12px",
                            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                            maxWidth: "500px",
                            width: "90%",
                            overflow: "hidden",
                            maxHeight: "80vh",
                            overflowY: "auto",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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
                                    fontSize: "20px",
                                    fontWeight: "600",
                                }}
                            >
                                ✅ Chốt lời thành công!
                            </h3>
                            <button
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "white",
                                    fontSize: "24px",
                                    cursor: "pointer",
                                    padding: 0,
                                }}
                                onClick={() => setShowSuccessModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div
                            style={{
                                padding: "30px",
                                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                            }}
                        >
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", color: "#e0e0e0" }}>
                                <div>
                                    <p style={{ margin: "0 0 5px 0", color: "#888", fontSize: "12px" }}>🆔 ID Sản phẩm</p>
                                    <p style={{ margin: "0", fontSize: "16px", fontWeight: "600", color: "#ffd700" }}>
                                        {successData.vi_id}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: "0 0 5px 0", color: "#888", fontSize: "12px" }}>💰 Giá bán</p>
                                    <p style={{ margin: "0", fontSize: "16px", fontWeight: "600" }}>
                                        {Number(submittedPrice).toLocaleString("vi-VN")} VND
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: "0 0 5px 0", color: "#888", fontSize: "12px" }}>📦 Số lượng bán</p>
                                    <p style={{ margin: "0", fontSize: "16px", fontWeight: "600" }}>
                                        {baseUnit === "kg"
                                            ? `${Number(successData.so_luong_ban)} kg`
                                            : `${Number(successData.so_luong_ban)} lượng`}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: "0 0 5px 0", color: "#888", fontSize: "12px" }}>📊 Số lượng còn lại</p>
                                    <p style={{ margin: "0", fontSize: "16px", fontWeight: "600" }}>
                                        {baseUnit === "kg"
                                            ? `${Number(successData.so_luong_con_lai)} kg`
                                            : `${Number(successData.so_luong_con_lai)} lượng`}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: "0 0 5px 0", color: "#888", fontSize: "12px" }}>📈 Tổng lãi/lỗ</p>
                                    <p
                                        style={{
                                            margin: "0",
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: successData.tong_lai_lo >= 0 ? "#10b981" : "#ff6b6b",
                                        }}
                                    >
                                        {Number(successData.tong_lai_lo).toLocaleString("vi-VN")} VND
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: "0 0 5px 0", color: "#888", fontSize: "12px" }}>🏷️ Trạng thái</p>
                                    <p
                                        style={{
                                            margin: "0",
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: successData.trang_thai === "LOI" ? "#10b981" : "#fc0303",
                                        }}
                                    >
                                        {successData.trang_thai}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: "0 0 5px 0", color: "#888", fontSize: "12px" }}>✓ Kết quả</p>
                                    <p
                                        style={{
                                            margin: "0",
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: successData.status === "success" ? "#10b981" : "#fc0303",
                                        }}
                                    >
                                        {successData.status === "success" ? "Thành công" : "Thất bại"}
                                    </p>
                                </div>
                            </div>
                        </div>

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
                                    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                                    color: "#FFD700",
                                    transition: "all 0.3s",
                                }}
                                onClick={async () => {
                                    setShowSuccessModal(false);

                                    // reset selected product (optional nếu muốn sạch UI)
                                    setSelectedProduct(null);

                                    // fetch lại data
                                    await fetchOwnedProducts(accountInfo);
                                }}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SellGold;
