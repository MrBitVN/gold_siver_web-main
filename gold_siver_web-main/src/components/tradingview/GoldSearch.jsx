import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GoldSearch = () => {
  const [textSearch, setTextSearch] = useState('gold');
  const [pageSend, setPageSend] = useState(1);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [showVIMap, setShowVIMap] = React.useState({});
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Tạo FormData để khớp với cấu hình 'form-data' trong Postman của bạn
    const formData = new FormData();
    formData.append('text_search', textSearch);
    formData.append('page_send', pageSend);

    try {
      const response = await fetch('https://api_gold.thinkdiff.us/search_forums_data', {
        method: 'POST',
        body: formData,
        // Lưu ý: Không set Header 'Content-Type' thủ công khi dùng FormData 
        // để trình duyệt tự động set boundary.
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Dư liệu ", data)
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 📄 Bell */}
      <button
        className="notification-bell bell-icon"
        onClick={() => setOpen(prev => !prev)}
      >
        🔍
      </button>
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setOpen(false)} // click ngoài modal sẽ tắt
        >
          <div
            style={{
              color: '#fff',
              background: '#000',
              padding: '20px',
              maxWidth: '800px',
              width: '90%',
              borderRadius: '8px',
              fontFamily: 'Arial',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()} // ngăn click từ modal làm đóng
          >
            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '40px',
                border: 'none',
                background: 'transparent',
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              ❌
            </button>

            <h2>Tìm kiếm dữ liệu</h2>

            <form onSubmit={handleSearch} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={textSearch}
                onChange={(e) => setTextSearch(e.target.value)}
                placeholder="Nhập từ khóa..."
                style={{ padding: '8px', flex: 1 }}
              />
              <input
                type="number"
                value={pageSend}
                onChange={(e) => setPageSend(e.target.value)}
                style={{ padding: '8px', width: '60px' }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '8px 20px',
                  cursor: 'pointer',
                  backgroundColor: '#0f0f10',
                  color: '#fff',
                  border: '1px solid #ddd'
                }}
              >
                {loading ? 'Đang gửi...' : 'Tìm kiếm'}
              </button>
            </form>

            {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}

            {results && results.noidung_search && (
              <div style={{
                marginTop: '20px',
                maxHeight: '400px',
                overflowY: 'auto',
                color: '#fff',          // chữ trắng mặc định
                background: '#282828',    // nền đen
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}>
                <h3 style={{ color: '#fff', marginBottom: '15px' }}>Kết quả tìm kiếm:</h3>

                {results?.noidung_search?.map((group, index) => (
                  <div key={index} style={{ marginBottom: '20px' }}>
                    {group.data && group.data.map((item) => {
                      const showVI = showVIMap[item.id] ?? true; // mặc định hiển thị contentVI

                      const toggleShow = () => {
                        setShowVIMap(prev => ({
                          ...prev,
                          [item.id]: !prev[item.id]
                        }));
                      };

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            navigate(`/tin-tuc-moi-nhat?page=${pageSend}&idPost=${item.id}`);
                            setOpen(false);
                          }}
                          style={{
                            color: '#fff',
                            padding: '12px',
                            marginBottom: '10px',
                            borderRadius: '6px',
                            boxShadow: '0 2px 4px rgba(32, 32, 32, 0.05)',
                            borderLeft: '4px solid #f3f6fa',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            color: 'rgb(9, 182, 49)',
                            marginBottom: '5px'
                          }}>
                            <span>ID: {item.id} - User: {item.idUser}</span>
                            <span>{item.actionAt}</span>
                          </div>

                          {/* Nội dung chính */}
                          <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#fff' }}>
                            {showVI ? (item.contentVI || "Không có nội dung tiếng Việt") : item.content || "Không có nội dung gốc"}
                          </p>

                          {/* Nút toggle */}
                          <button
                            onClick={toggleShow}
                            style={{
                              marginBottom: '10px',
                              padding: '4px 8px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              border: '1px solid #ddd',
                              backgroundColor: '#0f0f10',
                              color: '#fff'
                            }}
                          >
                            {showVI ? "Xem bản gốc" : "Xem tiếng Việt"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {results.noidung_search.length === 0 && <p style={{ color: '#fff' }}>Không tìm thấy dữ liệu phù hợp.</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>

  );
};

export default GoldSearch;