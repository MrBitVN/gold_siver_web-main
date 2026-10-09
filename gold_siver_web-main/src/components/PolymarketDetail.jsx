import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText } from '../services/translationService';

const PolymarketDetail = ({ item, onClose }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'vi';

  const [displayTitle, setDisplayTitle] = useState(item.title_vi || item.title_en || '');
  const [displayDesc, setDisplayDesc] = useState('');
  const [loadingTrans, setLoadingTrans] = useState(false);

  useEffect(() => {
    let active = true;
    const loadTranslation = async () => {
      if (currentLang === 'en') {
        setDisplayTitle(item.title_en || '');
        setDisplayDesc(item.context_en || '');
        return;
      }

      setLoadingTrans(true);
      try {
        const transTitle = await translateText(item.title_en || '', currentLang);
        if (active) setDisplayTitle(transTitle);

        const descToTrans = item.context_en || '';
        const transDesc = await translateText(descToTrans, currentLang);
        if (active) setDisplayDesc(transDesc);
      } catch (err) {
        console.error("Error translating detail:", err);
      } finally {
        if (active) setLoadingTrans(false);
      }
    };

    loadTranslation();
    return () => {
      active = false;
    };
  }, [item.id, currentLang]);

  useEffect(() => {
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!item) return null;

  const formatCurrency = (val) => {
    if (!val) return '$0.00';
    if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M';
    if (val >= 1e3) return '$' + (val / 1e3).toFixed(2) + 'K';
    return '$' + val.toFixed(2);
  };

  const descRaw = displayDesc || t('polymarket.noDescription', 'Không có mô tả chi tiết cho sự kiện này.');
  const markets = item.markets ? [...item.markets].sort((a,b) => b.volume - a.volume) : [];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
      zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px',
        width: '100%', maxWidth: '680px', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)', transform: 'scale(1)', animation: 'modalScale 0.3s ease-out'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.05)', border: 'none',
            color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s'
          }} onMouseEnter={e => {e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'}}
             onMouseLeave={e => {e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'}}>
            ✕
          </button>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 12px 0', paddingRight: '40px' }}>
            {loadingTrans ? (
              <span style={{ color: '#64748b', fontSize: '1rem', fontStyle: 'italic' }}>Translating...</span>
            ) : (
              displayTitle
            )}
          </h2>
          <div style={{ display: 'flex', gap: '20px', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>
            <span>💰 <strong>{formatCurrency(item.totalVolume)}</strong> Vol</span>
            <span>⏳ {t('polymarket.updated', 'Cập nhật')}: {item.updated_at || 'N/A'}</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1, 
           scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent'
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', color: '#cbd5e1',
            lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.05)'
          }} dangerouslySetInnerHTML={{ __html: descRaw.replace(/\n/g, '<br/>') }} />
          
          <h3 style={{ fontSize: '1.1rem', color: '#38bdf8', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 {t('polymarket.marketOptions', 'Các lựa chọn thị trường')}
          </h3>
          
          {markets.length > 0 ? markets.map((m, idx) => {
            const yesOpt = m.options_data.find(o => o.option_name === 'Yes') || {probability_percent: 0, price: '0¢'};
            const noOpt = m.options_data.find(o => o.option_name === 'No') || {probability_percent: 0, price: '0¢'};
            return (
              <div key={idx} style={{ 
                background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', 
                marginBottom: '16px', border: '1px solid rgba(255,255,255,0.04)', transition: '0.2s' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '1.05rem' }}>{m.market_name}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                    Vol: {formatCurrency(m.volume)}
                  </span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', display: 'flex', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', marginBottom: '8px' }}>
                  <div style={{ width: `${yesOpt.probability_percent}%`, background: '#10b981' }}></div>
                  <div style={{ width: `${noOpt.probability_percent}%`, background: '#ef4444' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                  <span style={{ color: '#10b981' }}>YES {yesOpt.probability_percent.toFixed(1)}% ({yesOpt.price})</span>
                  <span style={{ color: '#ef4444' }}>NO {noOpt.probability_percent.toFixed(1)}% ({noOpt.price})</span>
                </div>
              </div>
            );
          }) : (
            <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>{t('polymarket.noMarketData', 'Chưa có dữ liệu thị trường')}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.1)', display: 'flex', gap: '16px' }}>
          <button style={{
            flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #10b981', background: 'rgba(16, 185, 129, 0.1)',
            color: '#10b981', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s'
          }} onMouseEnter={(e) => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(16,185,129,0.3)'; }}
             onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.color = '#10b981'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
            {t('polymarket.betYes', 'Cược YES')}
          </button>
          <button style={{
            flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s'
          }} onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(239,68,68,0.3)'; }}
             onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
            {t('polymarket.betNo', 'Cược NO')}
          </button>
        </div>

      </div>
      <style>{`
        @keyframes modalScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default PolymarketDetail;
