import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText } from '../services/translationService';

const PolymarketCard = ({ item, onClick, searchQuery }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'vi';

  const [displayTitle, setDisplayTitle] = useState(item.title_vi || item.title_en || '');
  const [displayMarketName, setDisplayMarketName] = useState('');
  const [loadingTrans, setLoadingTrans] = useState(false);

  useEffect(() => {
    let active = true;
    const loadTranslation = async () => {
      // Nếu là tiếng Anh thì giữ nguyên bản gốc tiếng Anh
      if (currentLang === 'en') {
        setDisplayTitle(item.title_en || '');
        if (item.mainMarket) {
          setDisplayMarketName(item.mainMarket.market_name || '');
        }
        return;
      }

      setLoadingTrans(true);
      try {
        const transTitle = await translateText(item.title_en || '', currentLang);
        if (active) setDisplayTitle(transTitle);

        if (item.mainMarket && item.mainMarket.market_name) {
          const transMarket = await translateText(item.mainMarket.market_name, currentLang);
          if (active) setDisplayMarketName(transMarket);
        }
      } catch (err) {
        console.error("Error translating card:", err);
      } finally {
        if (active) setLoadingTrans(false);
      }
    };

    loadTranslation();
    return () => {
      active = false;
    };
  }, [item.id, currentLang]);

  const highlightText = (text, highlight) => {
    if (!highlight || !highlight.trim()) return text;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() 
        ? <span key={index} style={{ backgroundColor: 'rgba(250, 204, 21, 0.3)', color: '#facc15', fontWeight: 'bold', padding: '0 2px', borderRadius: '4px' }}>{part}</span> 
        : part
    );
  };
  const formatCurrency = (val) => {
    if (!val) return '$0.00';
    if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M';
    if (val >= 1e3) return '$' + (val / 1e3).toFixed(2) + 'K';
    return '$' + val.toFixed(2);
  };

  let yesProb = 50, noProb = 50;
  let marketName = displayMarketName || t('polymarket.noData', 'Chưa có dữ liệu');
  
  if (item.mainMarket) {
      const yesOpt = item.mainMarket.options_data.find(o => o.option_name === 'Yes');
      const noOpt = item.mainMarket.options_data.find(o => o.option_name === 'No');
      if (yesOpt) yesProb = yesOpt.probability_percent;
      if (noOpt) noProb = noOpt.probability_percent;
  }

  return (
    <div 
      onClick={onClick}
      style={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '24px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.9)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f8fafc', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
          {loadingTrans ? (
            <span style={{ color: '#64748b', fontSize: '0.95rem', fontStyle: 'italic' }}>Translating...</span>
          ) : (
            highlightText(displayTitle, searchQuery)
          )}
        </h3>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '0.85rem' }}>
        <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '6px 10px', borderRadius: '6px', fontWeight: 600 }}>
          💰 {formatCurrency(item.totalVolume)}
        </span>
        <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ⏳ {item.updated_at ? item.updated_at.split(' ')[0] : 'N/A'}
        </span>
      </div>
      
      {item.mainMarket ? (
        <>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 'auto', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t('polymarket.market', 'Thị trường')}: <strong>{marketName}</strong>
          </div>
          <div style={{ height: '8px', borderRadius: '4px', display: 'flex', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.05)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}>
            <div style={{ width: `${yesProb}%`, background: '#10b981', transition: 'width 1s ease' }}></div>
            <div style={{ width: `${noProb}%`, background: '#ef4444', transition: 'width 1s ease' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginTop: '10px' }}>
            <span style={{ color: '#10b981' }}>YES {yesProb.toFixed(1)}%</span>
            <span style={{ color: '#ef4444' }}>NO {noProb.toFixed(1)}%</span>
          </div>
        </>
      ) : (
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 'auto' }}>{t('polymarket.noBetting', 'Sự kiện chưa mở cược')}</div>
      )}
    </div>
  );
};

export default PolymarketCard;
