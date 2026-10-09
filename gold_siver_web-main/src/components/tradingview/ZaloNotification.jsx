import React, { useState, useEffect } from 'react';

const ZaloNotification = () => {
  const [show, setShow] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Hàm thực hiện việc hiện thông báo
    const triggerNotification = () => {
      setShow(true);
      setIsFading(false);
      
      // Sau 4 giây thì bắt đầu hiệu ứng mờ dần
      const fadeTimeout = setTimeout(() => {
        setIsFading(true);
        // Sau 1 giây mờ dần (tổng 5s) thì ẩn hẳn
        setTimeout(() => setShow(false), 1000);
      }, 4000);

      return fadeTimeout;
    };

    // 1. Chờ đúng 5 phút (300,000ms) sau khi F5 mới hiển thị lần đầu
    const initialTimeout = setTimeout(() => {
      triggerNotification();
    }, 5 * 60 * 1000); // 5 phút

    // 2. Thiết lập lặp lại mỗi 30 phút sau đó
    const interval = setInterval(triggerNotification, 30 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  if (!show) return null;

  // Giữ nguyên phần styles và return JSX của bạn...
  const styles = {
    overlay: {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#ffffff',
      color: '#333',
      padding: '24px',
      borderRadius: '20px',
      zIndex: 10000,
      textAlign: 'center',
      boxShadow: '0 20px 50px rgba(0, 104, 255, 0.3)',
      transition: 'opacity 1s ease-out, transform 0.5s ease-out',
      opacity: isFading ? 0 : 1,
      width: '300px',
      border: '1px solid #e1e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    },
    closeButton: {
      position: 'absolute',
      top: '12px',
      right: '15px',
      background: 'none',
      border: 'none',
      fontSize: '20px',
      color: '#aaa',
      cursor: 'pointer',
      lineHeight: '1',
      padding: '5px'
    },
    logoContainer: {
      width: '60px',
      height: '60px',
      backgroundColor: '#0068ff',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 15px auto',
      boxShadow: '0 4px 12px rgba(0, 104, 255, 0.4)'
    },
    zLabel: {
      color: 'white',
      fontSize: '20px',
      fontWeight: 'bold',
      fontStyle: 'italic'
    },
    title: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#0068ff',
      marginBottom: '8px'
    },
    description: {
      fontSize: '14px',
      lineHeight: '1.5',
      color: '#555',
      marginBottom: '20px'
    },
    button: {
      backgroundColor: '#0068ff',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '30px',
      textDecoration: 'none',
      fontWeight: '600',
      fontSize: '15px',
      display: 'block',
      transition: 'background-color 0.3s',
      boxShadow: '0 4px 15px rgba(0, 104, 255, 0.3)'
    }
  };

  return (
    <div style={styles.overlay}>
      <button 
        style={styles.closeButton} 
        onClick={() => setShow(false)}
        title="Đóng"
      >
        &times;
      </button>

      <div style={styles.logoContainer}>
        <span style={styles.zLabel}>Zalo</span>
      </div>

      <div style={styles.title}>Tham giá nhóm Zalo của Team tại đây</div>
      
      <div style={styles.description}>
         Phân tích thị trường và hỗ trợ trực tiếp từ đội ngũ chuyên gia.
      </div>

      <a 
        href="https://zalo.me/g/fziorf173" 
        target="_blank" 
        rel="noopener noreferrer" 
        style={styles.button}
        onMouseOver={(e) => e.target.style.backgroundColor = '#0055d4'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#0068ff'}
      >
        THAM GIA NHÓM ZALO
      </a>
      
      <div style={{ marginTop: '12px', fontSize: '11px', color: '#aaa' }}>
        Thông báo này sẽ tự động đóng
      </div>
    </div>
  );
};

export default ZaloNotification;