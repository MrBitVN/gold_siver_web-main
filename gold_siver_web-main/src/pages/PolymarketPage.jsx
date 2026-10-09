import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePolymarket } from '../hooks/usePolymarket';
import PolymarketCard from '../components/PolymarketCard';
import PolymarketDetail from '../components/PolymarketDetail';

const PolymarketPage = () => {
  const { t, i18n } = useTranslation();
  const { data, loading, error } = usePolymarket();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState('hot');
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (e) => {
    setSortMode(e.target.value);
    setCurrentPage(1);
  };

  const currentLang = i18n.language || 'vi';
  
  const getLocalizedTitle = (item) => {
    const langKey = currentLang.toLowerCase() === 'zh-cn' ? 'zh' : currentLang.toLowerCase();
    return item[`title_${langKey}`] || item.title_en || item.title_vi || '';
  };

  const filteredData = data.filter(item => {
    const title = getLocalizedTitle(item).toLowerCase();
    return title.includes(searchQuery.toLowerCase());
  });

  if (sortMode === 'hot' || sortMode === 'volume') {
    filteredData.sort((a, b) => b.totalVolume - a.totalVolume);
  } else if (sortMode === 'newest') {
    filteredData.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
  }

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div style={{ background: '#020617', color: '#f8fafc', padding: '40px 5%', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        
        <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '20px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, background: 'linear-gradient(45deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t('polymarket.title', 'Polymarket Explorer')}
          </h1>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder={t('polymarket.searchPlaceholder', '🔍 Tìm kiếm sự kiện...')} 
              value={searchQuery}
              onChange={handleSearch}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                padding: '10px 16px', borderRadius: '10px', outline: 'none', width: '250px', transition: '0.3s'
              }}
              onFocus={e => {e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56,189,248,0.2)';}}
              onBlur={e => {e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none';}}
            />
            <select 
              value={sortMode}
              onChange={handleSort}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                padding: '10px 16px', borderRadius: '10px', outline: 'none', cursor: 'pointer', transition: '0.3s'
              }}
              onFocus={e => {e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56,189,248,0.2)';}}
              onBlur={e => {e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none';}}
            >
              <option value="hot" style={{ background: '#0f172a' }}>{t('polymarket.sortHot', '🔥 Đang Hot')}</option>
              <option value="volume" style={{ background: '#0f172a' }}>{t('polymarket.sortVolume', '💎 Volume Cao Nhất')}</option>
              <option value="newest" style={{ background: '#0f172a' }}>{t('polymarket.sortNewest', '🕒 Mới cập nhật')}</option>
            </select>
          </div>
        </header>

        {error && (
          <div style={{ color: '#ef4444', textAlign: 'center', padding: '20px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', marginBottom: '24px' }}>
            ⚠️ {error}
          </div>
        )}

        {loading && data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '1.2rem', animation: 'pulse 2s infinite' }}>
            {t('polymarket.loading', 'Đang tải dữ liệu thời gian thực...')}
          </div>
        ) : (
          <>
            <style>{`
              .polymarket-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 24px;
              }
              @media (max-width: 1024px) {
                .polymarket-grid {
                  grid-template-columns: repeat(2, 1fr);
                }
              }
              @media (max-width: 640px) {
                .polymarket-grid {
                  grid-template-columns: 1fr;
                }
              }
            `}</style>
            <div className="polymarket-grid">
              {filteredData.length === 0 && !loading && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#64748b', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                  {t('polymarket.noEventsFound', 'Không tìm thấy sự kiện nào phù hợp.')}
                </div>
              )}
              {currentData.map((item, idx) => (
                <PolymarketCard key={item.id || idx} item={item} searchQuery={searchQuery} onClick={() => setSelectedItem(item)} />
              ))}
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '40px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '8px 16px', background: currentPage === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(250, 204, 21, 0.15)', color: currentPage === 1 ? '#64748b' : '#facc15', border: currentPage === 1 ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(250, 204, 21, 0.3)', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, transition: '0.2s' }}
                  onMouseEnter={e => { if (currentPage !== 1) e.currentTarget.style.background = 'rgba(250, 204, 21, 0.25)' }}
                  onMouseLeave={e => { if (currentPage !== 1) e.currentTarget.style.background = 'rgba(250, 204, 21, 0.15)' }}
                >
                  {t('polymarket.prevPage', 'Trước')}
                </button>
                
                {getPageNumbers().map((num, idx) => (
                  num === '...' ? (
                    <span key={`dots-${idx}`} style={{ color: '#64748b', padding: '0 8px' }}>...</span>
                  ) : (
                    <button
                      key={num}
                      onClick={() => setCurrentPage(num)}
                      style={{ 
                        width: '40px', height: '40px', 
                        background: currentPage === num ? '#38bdf8' : 'rgba(255,255,255,0.05)', 
                        color: currentPage === num ? '#0f172a' : '#f8fafc', 
                        border: '1px solid ' + (currentPage === num ? '#38bdf8' : 'rgba(255,255,255,0.1)'), 
                        borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: '0.2s'
                      }}
                      onMouseEnter={e => { if (currentPage !== num) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                      onMouseLeave={e => { if (currentPage !== num) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    >
                      {num}
                    </button>
                  )
                ))}

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '8px 16px', background: currentPage === totalPages ? 'rgba(255,255,255,0.05)' : 'rgba(250, 204, 21, 0.15)', color: currentPage === totalPages ? '#64748b' : '#facc15', border: currentPage === totalPages ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(250, 204, 21, 0.3)', borderRadius: '8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, transition: '0.2s' }}
                  onMouseEnter={e => { if (currentPage !== totalPages) e.currentTarget.style.background = 'rgba(250, 204, 21, 0.25)' }}
                  onMouseLeave={e => { if (currentPage !== totalPages) e.currentTarget.style.background = 'rgba(250, 204, 21, 0.15)' }}
                >
                  {t('polymarket.nextPage', 'Sau')}
                </button>
              </div>
            )}
          </>
        )}

      </div>

      {selectedItem && (
        <PolymarketDetail item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default PolymarketPage;
