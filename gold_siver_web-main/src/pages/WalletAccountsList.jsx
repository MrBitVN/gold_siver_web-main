import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { loginWalletWithFallback } from "../services/walletLoginService";
import "./WalletAccountsList.css";
import { logUserInfo } from "../utils/logUserInfo";
import { useTranslation } from "react-i18next";
const WalletAccountsList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { username: urlUsername } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const [wallets, setWallets] = useState([]);
    const [currentAccount, setCurrentAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [password, setPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [currentPage, setCurrentPage] = useState(() => {
        const pageParam = searchParams.get("page");
        return pageParam ? parseInt(pageParam, 10) : 1;
    });
    const walletsPerPage = 6;

    useEffect(() => {
        logUserInfo("Trang Danh sách ví - WalletAccountsList.jsx");
    }, []);

    /* ================= LOAD WALLETS ================= */
    useEffect(() => {
        const fetchWalletsFromAPI = async () => {
            setLoading(true);
            try {
                // ===== LOAD ACCOUNT ĐANG LOGIN =====
                const storedCurrent = localStorage.getItem("accountInfo");
                if (storedCurrent) {
                    setCurrentAccount(JSON.parse(storedCurrent));
                }

                // ===== LẤY IP TỪ all_json_1_day =====
                const now = new Date();
                const checkDay = now.getDate();
                const checkMonth = now.getMonth() + 1;
                const checkYear = now.getFullYear();

                const ipResponse = await fetch(
                    `https://api_gold.thinkdiff.us/all_json_1_day/${checkDay}_${checkMonth}_${checkYear}`
                );

                if (!ipResponse.ok) {
                    throw new Error("Không gọi được API lấy IP");
                }

                const ipData = await ipResponse.json();

                if (ipData.status !== "success" || !ipData.ip_location) {
                    throw new Error("Không có ip_location trong API");
                }

                const userIP = ipData.ip_location;
                console.log("✓ User IP:", userIP);

                // ===== FETCH WALLET THEO IP =====
                const apiUrl = `https://api_gold.thinkdiff.us/api/vi/find_by_iplocation/${userIP}`;
                console.log("Fetching wallets:", apiUrl);

                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }

                const data = await response.json();
                console.log("=== API Response ===", data);

                // ===== XỬ LÝ DATA =====
                let accountsList = [];

                if (Array.isArray(data)) {
                    accountsList = data;
                } else if (data?.data && Array.isArray(data.data)) {
                    accountsList = data.data;
                } else if (typeof data === "object") {
                    accountsList = Object.values(data).filter(
                        item => typeof item === "object" && item?.email
                    );
                }

                const walletsWithTx = accountsList.map(account => {
                    let username = account.id_thongke_taikhoan;

                    // Fallback an toàn (hiếm)
                    if (!username) {
                        username =
                            account.username ||
                            account.vi ||
                            account.tai_khoan ||
                            account.account_name ||
                            account.name ||
                            null;
                    }

                    // Fallback cuối cùng – KHÔNG random
                    if (!username) {
                        const stableId = account.id_taikhoan || account.id;
                        if (stableId) {
                            username = `wallet_${stableId}`;
                        }
                    }

                    const txKey = `transactions_${username}`;
                    const tx = JSON.parse(localStorage.getItem(txKey)) || [];

                    return {
                        ...account,
                        username: String(username).trim(),
                        email: account.email || account.dia_chi_email || "",
                        id_taikhoan: account.id_taikhoan || account.id || "",
                        id_thongke_taikhoan:
                            account.id_thongke_taikhoan || account.id_thongke || "",
                        password: account.password || "",
                        timecreate:
                            account.timecreate ||
                            account.created_at ||
                            new Date().toISOString(),
                        transactions: tx,
                    };
                });

                // ===== REMOVE DUPLICATE USERNAME =====
                const seen = new Set();
                const uniqueWallets = walletsWithTx.filter(w => {
                    if (seen.has(w.username)) return false;
                    seen.add(w.username);
                    return true;
                });

                // ===== SORT NEWEST FIRST =====
                uniqueWallets.sort(
                    (a, b) => new Date(b.timecreate) - new Date(a.timecreate)
                );

                setWallets(uniqueWallets);
                setCurrentPage(1);

                console.log("✓ Wallets loaded:", uniqueWallets);

                // ===== AUTO OPEN MODAL IF URL HAS USERNAME =====
                if (urlUsername) {
                    const walletToOpen = uniqueWallets.find(
                        w => w.username === urlUsername
                    );
                    if (walletToOpen) {
                        setTimeout(() => {
                            handleOpenPasswordModal(walletToOpen);
                        }, 100);
                    }
                }
            } catch (err) {
                console.error("❌ Lỗi load danh sách ví:", err);
                setWallets([]);
            } finally {
                setLoading(false);
            }
        };

        fetchWalletsFromAPI();
    }, [urlUsername]);


    /* ================= CALCULATE STATS ================= */
    const calculateWalletStats = (wallet) => {
        let totalMoneySpent = 0;
        let vangQuantity = 0;
        let bacQuantity = 0;

        wallet.transactions.forEach((tx) => {
            totalMoneySpent += tx.tong_tien || 0;

            if (tx.loai_san_pham === "VANG") {
                vangQuantity += tx.soluong || 0;
            } else if (tx.loai_san_pham === "BAC") {
                bacQuantity += tx.soluong || 0;
            }
        });

        return {
            totalMoneySpent,
            vangQuantity,
            bacQuantity,
            totalTransactions: wallet.transactions.length,
        };
    };

    /* ================= SWITCH WALLET ================= */
    const handleLoginWallet = async (wallet) => {
        try {
            setLoading(true);

            // Gọi API để đăng nhập ví
            const accountData = await loginWalletWithFallback(wallet.username);

            // Lưu toàn bộ thông tin tài khoản
            localStorage.setItem("accountInfo", JSON.stringify(accountData));

            console.log("✓ Đăng nhập ví thành công:", accountData);

            // Chuyển hướng đến trang chi tiết lãi/lỗ với username trong URL
            navigate(`/vi/${wallet.username}`);
        } catch (err) {
            console.error("Lỗi đăng nhập ví:", err);
            alert(`Lỗi đăng nhập: ${err.message}`);
            setLoading(false);
        }
    };

    /* ================= OPEN PASSWORD MODAL ================= */
    const handleOpenPasswordModal = (wallet) => {
        setSelectedWallet(wallet);
        setPassword("");
        setPasswordError("");
        setShowPasswordModal(true);
    };

    /* ================= CONFIRM PASSWORD LOGIN ================= */
    const handleConfirmPasswordLogin = async () => {
        if (!password.trim()) {
            alert(t("walletList.passwordModal.empty"));
            return;
        }

        try {
            setPasswordLoading(true);

            // Lưu mật khẩu tạm thời để dùng cho API
            const accountData = {
                ...selectedWallet,
                username: selectedWallet.username,
                password: password,
                loginTime: new Date().toISOString(),
            };

            // Lưu toàn bộ thông tin tài khoản
            localStorage.setItem("accountInfo", JSON.stringify(accountData));

            console.log("✓ Đăng nhập ví thành công:", selectedWallet.username);

            // Đóng modal và chuyển hướng
            setShowPasswordModal(false);
            navigate(`/vi/${selectedWallet.username}`);
        } catch (err) {
            console.error("Lỗi đăng nhập:", err);
            alert(`Lỗi: ${err.message}`);
        } finally {
            setPasswordLoading(false);
        }
    };

    /* ================= DIRECT LOGIN (từ URL) ================= */
    const handleDirectLogin = async () => {
        if (!password.trim()) {
            setPasswordError("❌ Vui lòng nhập mật khẩu");
            return;
        }

        try {
            setPasswordLoading(true);
            setPasswordError("");

            console.log(`Đang đăng nhập trực tiếp cho ví: ${urlUsername}`);

            // Gọi API để lấy dữ liệu ví
            const apiUrl = `https://api_gold.thinkdiff.us/api/vi/${urlUsername}?password=${encodeURIComponent(password)}`;

            const response = await fetch(apiUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setPasswordError("❌ Mật khẩu không chính xác");
                } else {
                    setPasswordError(`❌ Lỗi API: ${response.status}`);
                }
                setPasswordLoading(false);
                return;
            }

            const apiData = await response.json();

            // Kiểm tra xem API có trả về lỗi không
            if (apiData.status !== "success" && apiData.error) {
                setPasswordError(`❌ ${apiData.error}`);
                setPasswordLoading(false);
                return;
            }

            // Tạo object accountInfo từ dữ liệu API
            const accountInfo = {
                username: urlUsername,
                password: password,
                ...apiData,
                loginTime: new Date().toISOString(),
                source: "api",
            };

            // Lưu vào localStorage
            localStorage.setItem("accountInfo", JSON.stringify(accountInfo));

            console.log("✓ Đăng nhập thành công từ API:", accountInfo);

            // Chuyển hướng đến trang chi tiết lãi/lỗ
            navigate(`/vi/${urlUsername}`);
        } catch (err) {
            console.error("Lỗi đăng nhập:", err);
            setPasswordError(`❌ Lỗi: ${err.message}`);
            setPasswordLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="wallet-accounts-container">
                <div className="wallet-accounts-card">
                    <p style={{ textAlign: "center", padding: "30px" }}>
                        {t("walletList.loading")}
                    </p>
                </div>
            </div>
        );
    }

    // Nếu có username trong URL, chỉ hiển thị modal nhập password (không hiển thị danh sách ví)
    if (urlUsername) {
        return (
            <div style={{ minHeight: "100vh" }}>
                {/* ================= PASSWORD MODAL ONLY ================= */}
                {(
                    <div className="password-modal-overlay">
                        <div className="password-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="password-modal-header">
                                <h3>🔐 Nhập mật khẩu để đăng nhập</h3>
                                <button
                                    className="close-btn"
                                    onClick={() => navigate("/")}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="password-modal-body">
                                <p className="wallet-name">Tài khoản: <strong>{urlUsername}</strong></p>

                                {passwordError && (
                                    <div className="error-message" style={{
                                        background: "#fee",
                                        color: "#c33",
                                        padding: "12px 15px",
                                        borderRadius: "6px",
                                        marginBottom: "15px",
                                        borderLeft: "4px solid #c33",
                                        fontSize: "14px",
                                        wordBreak: "break-word"
                                    }}>
                                        {passwordError}
                                    </div>
                                )}

                                <input
                                    type="password"
                                    className="password-input"
                                    placeholder="Nhập mật khẩu..."
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setPasswordError("");
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !passwordLoading) {
                                            handleDirectLogin();
                                        }
                                    }}
                                    disabled={passwordLoading}
                                    autoFocus
                                />
                            </div>

                            <div className="password-modal-footer">
                                <button
                                    className="cancel-btn"
                                    onClick={() => navigate("/")}
                                    disabled={passwordLoading}
                                >
                                    Hủy
                                </button>
                                <button
                                    className="confirm-btn"
                                    onClick={handleDirectLogin}
                                    disabled={passwordLoading}
                                >
                                    {passwordLoading ? "⏳ Đang đăng nhập..." : "✓ Đăng nhập"}
                                </button>
                            </div>
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
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                padding: 20px;
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                            }

                            .password-modal-header h3 {
                                margin: 0;
                                font-size: 18px;
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
                            }

                            .wallet-name {
                                margin: 0 0 20px 0;
                                color: #666;
                                font-size: 14px;
                            }

                            .wallet-name strong {
                                color: #333;
                                font-weight: 600;
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
                            }

                            .password-input:focus {
                                outline: none;
                                border-color: #667eea;
                                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                            }

                            .password-input:disabled {
                                background: #f5f5f5;
                                cursor: not-allowed;
                            }

                            .password-modal-footer {
                                padding: 20px;
                                display: flex;
                                gap: 10px;
                                background: #f9f9f9;
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
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
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
                )}
            </div>
        );
    }

    return (
        <div className="wallet-accounts-container">
            <div className="wallet-accounts-card">
                <h2>{t("walletList.title")}</h2>
                <div className="wallet-top-actions">
                    <button
                        className="nav-btn left"
                        onClick={() => navigate("/dang-ky-tai-khoan")}
                    >
                        {t("walletList.back")}
                    </button>

                    <button
                        className="nav-btn right"
                        onClick={() => navigate("/wallet-buy")}
                    >
                        {t("walletList.goWallet")}
                    </button>
                </div>
                {wallets.length === 0 ? (
                    <p className="no-transactions">{t("walletList.empty")}</p>
                ) : (
                    <>
                        <div className="wallets-grid">
                            {wallets
                                .slice(
                                    (currentPage - 1) * walletsPerPage,
                                    currentPage * walletsPerPage
                                )
                                .map((wallet, index) => {
                                    const stats = calculateWalletStats(wallet);
                                    const isActive =
                                        currentAccount?.username === wallet.username;

                                    return (
                                        <div
                                            key={wallet.username || index}
                                            className={`wallet-card-item ${isActive ? "active" : ""}`}
                                        >
                                            <div className="wallet-header">
                                                <h3>👤 {wallet.username}</h3>
                                                {/* <span className="transaction-count">
                                                    {stats.totalTransactions} giao dịch
                                                </span> */}
                                            </div>
                                            <div className="wallet-email">
                                                <small>👤 {wallet.email}</small>
                                            </div>
                                            {isActive && (
                                                <div className="active-badge">{t("walletList.active")}</div>
                                            )}

                                            {/* <div className="wallet-stats">
                                                <div className="stat-item">
                                                    <span className="stat-label">💰 Tổng tiền mua</span>
                                                    <span className="stat-value">
                                                        {stats.totalMoneySpent.toLocaleString("vi-VN")} VND
                                                    </span>
                                                </div>

                                                <div className="stat-item">
                                                    <span className="stat-label">👑 Vàng</span>
                                                    <span className="stat-value">
                                                        {stats.vangQuantity} chỉ
                                                    </span>
                                                </div>

                                                <div className="stat-item">
                                                    <span className="stat-label">💎 Bạc</span>
                                                    <span className="stat-value">
                                                        {stats.bacQuantity} chỉ
                                                    </span>
                                                </div>
                                            </div> */}

                                            {!isActive && (
                                                <button
                                                    className="login-wallet-btn"
                                                    onClick={() => handleOpenPasswordModal(wallet)}
                                                >
                                                    {t("walletList.loginWallet")}
                                                </button>
                                            )}

                                            {isActive && (
                                                <div className="active-wallet-actions">
                                                    <button
                                                        className="detail-btn"
                                                        onClick={() => navigate(`/vi/${currentAccount.username}`)}
                                                    >
                                                        {t("walletList.viewDetail")}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>

                        {/* ================= PAGINATION ================= */}
                        {Math.ceil(wallets.length / walletsPerPage) > 1 && (
                            <div className="pagination-container">
                                <button
                                    className="pagination-btn"
                                    onClick={() => {
                                        const newPage = Math.max(1, currentPage - 1);
                                        setCurrentPage(newPage);
                                        setSearchParams({ page: newPage });
                                    }}
                                    disabled={currentPage === 1}
                                >
                                    {t("walletList.pagination.prev")}
                                </button>

                                <div className="pagination-numbers">
                                    {Array.from({ length: Math.ceil(wallets.length / walletsPerPage) }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                                            onClick={() => {
                                                setCurrentPage(page);
                                                setSearchParams({ page });
                                            }}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    className="pagination-btn"
                                    onClick={() => {
                                        const newPage = Math.min(Math.ceil(wallets.length / walletsPerPage), currentPage + 1);
                                        setCurrentPage(newPage);
                                        setSearchParams({ page: newPage });
                                    }}
                                    disabled={currentPage === Math.ceil(wallets.length / walletsPerPage)}
                                >
                                    {t("walletList.pagination.next")}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ================= PASSWORD MODAL ================= */}
            {showPasswordModal && (
                <div className="password-modal-overlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="password-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="password-modal-header">
                            <h3 className="abc">{t("walletList.passwordModal.title")}</h3>
                            <button
                                className="close-btn"
                                onClick={() => setShowPasswordModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="password-modal-body">
                            <p className="wallet-name">{t("walletList.passwordModal.account")}: <strong>{selectedWallet?.username}</strong></p>

                            <input
                                type="password"
                                className="password-input"
                                placeholder={t("walletList.passwordModal.placeholder")}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleConfirmPasswordLogin();
                                    }
                                }}
                                disabled={passwordLoading}
                                autoFocus
                            />
                        </div>

                        <div className="password-modal-footer">
                            <button
                                className="cancel-btn"
                                onClick={() => setShowPasswordModal(false)}
                                disabled={passwordLoading}
                            >
                                {t("walletList.passwordModal.cancel")}
                            </button>
                            <button
                                className="confirm-btn"
                                onClick={handleConfirmPasswordLogin}
                                disabled={passwordLoading}
                            >
                                {passwordLoading
                                    ? t("walletList.passwordModal.loading")
                                    : t("walletList.passwordModal.confirm")}
                            </button>
                        </div>
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
                            background: #FFD700;
                            color: white;
                            padding: 20px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        .abc{
                            color: black;
                            margin: 0;
                            font-size: 18px;
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
                            margin: 0 0 20px 0;
                            color: lightgreen;
                            font-size: 14px;
                        }

                        .wallet-name strong {
                            color: #FFD700;
                            font-weight: 600;
                        }

                        .password-input {
                            width: 100%;
                            padding: 12px 15px;
                            border: 2px solid #81d6d3;
                            border-radius: 8px;
                            font-size: 16px;
                            transition: all 0.3s;
                            box-sizing: border-box;
                            font-family: inherit;
                            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                            color: #FFD700;

                        }

                        .password-input:focus {
                            outline: none;
                            border-color: #FFD700;
                            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                        }

                        .password-input:disabled {
                            background: #f5f5f5;
                            cursor: not-allowed;
                        }

                        .password-modal-footer {
                            padding: 20px;
                            display: flex;
                            gap: 10px;
                            background: #FFD700;
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
                            color: white;
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
            )}
        </div>
    );
};

export default WalletAccountsList;
