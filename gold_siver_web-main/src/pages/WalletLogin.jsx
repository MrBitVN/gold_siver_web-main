import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loginWalletWithFallback } from "../services/walletLoginService";

const WalletLogin = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const performLogin = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!username) {
          throw new Error("Username không hợp lệ");
        }

        console.log(`Đang đăng nhập vào ví: ${username}`);

        // Gọi service đăng nhập
        const accountData = await loginWalletWithFallback(username);

        // Lưu thông tin tài khoản vào localStorage
        localStorage.setItem("accountInfo", JSON.stringify(accountData));

        console.log("✓ Đăng nhập ví thành công:", accountData);

        // Chuyển hướng đến trang chi tiết lãi/lỗ với username trong URL
        navigate(`/vi/${username}`, { replace: true });
      } catch (err) {
        console.error("Lỗi đăng nhập:", err);
        setError(err.message || "Lỗi khi đăng nhập ví");
        setLoading(false);
      }
    };

    performLogin();
  }, [username, navigate]);

  if (loading) {
    return (
      <div className="wallet-login-container">
        <div className="wallet-login-card">
          <div className="spinner"></div>
          <h2>⏳ Đang đăng nhập vào ví: {username}</h2>
          <p>Vui lòng chờ...</p>
        </div>

        <style>{`
          .wallet-login-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          .wallet-login-card {
            background: white;
            border-radius: 15px;
            padding: 50px 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
            max-width: 400px;
          }

          .wallet-login-card h2 {
            margin: 20px 0;
            color: #333;
            font-size: 20px;
          }

          .wallet-login-card p {
            color: #666;
            margin: 10px 0;
          }

          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wallet-login-container">
        <div className="wallet-login-card error">
          <h2>❌ Lỗi đăng nhập</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => navigate("/danh-sach-vi")}>
              ← Quay lại danh sách ví
            </button>
            <button onClick={() => navigate("/dang-ky-tai-khoan")}>
              📝 Tạo ví mới
            </button>
          </div>
        </div>

        <style>{`
          .wallet-login-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          .wallet-login-card {
            background: white;
            border-radius: 15px;
            padding: 50px 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
            max-width: 400px;
          }

          .wallet-login-card.error h2 {
            color: #e74c3c;
            margin: 0 0 15px 0;
            font-size: 20px;
          }

          .wallet-login-card.error p {
            color: #666;
            margin: 15px 0 20px 0;
            line-height: 1.5;
          }

          .error-actions {
            display: flex;
            gap: 10px;
            flex-direction: column;
          }

          .error-actions button {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .error-actions button:first-child {
            background: #667eea;
            color: white;
          }

          .error-actions button:first-child:hover {
            background: #5568d3;
          }

          .error-actions button:last-child {
            background: #f0f0f0;
            color: #1a1a1a;
            border: 2px solid #e5e7eb;
          }

          .error-actions button:last-child:hover {
            background: #fbbf24;
            color: #1a1a1a;
            border-color: #f59e0b;
            box-shadow: 0 4px 15px rgba(251, 191, 36, 0.3);
          }
        `}</style>
      </div>
    );
  }

  return null;
};

export default WalletLogin;
