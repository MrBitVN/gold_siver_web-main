import React, { useState } from 'react';
import TradingViewChart from './TradingViewChart';
import { convertApexToTradingView } from '../../utils/chartDataConverter';
import { useTranslation } from 'react-i18next';

const CombinedXauXagChart = ({ dataXau, dataXag }) => {
    const { t } = useTranslation();
    const [sharedZoom, setSharedZoom] = useState(null);

    const handleZoom = (zoomRange) => {
        setSharedZoom(zoomRange);
    };

    const tvDataXau = convertApexToTradingView(dataXau);
    const tvDataXag = convertApexToTradingView(dataXag);

    return (
        <div style={{ backgroundColor: '#000', padding: '20px', minHeight: '600px' }}>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
                gap: '20px' 
            }}>
                {/* Biểu đồ XAU */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        padding: '10px 0',
                        borderBottom: '1px solid #333'
                    }}>
                        <span style={{ fontSize: '20px' }}>🔔</span>
                        <h2 style={{ color: '#FFD700', margin: 0, fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {t('TradingViewChart.xauTitle')}
                        </h2>
                    </div>
                    <TradingViewChart 
                        data={tvDataXau} 
                        onZoom={handleZoom} 
                        externalZoom={sharedZoom}
                        chartLabel="XAUUSD"
                        volumeLabel="Volume XAU"
                        volumeColor="rgba(255, 215, 0, 0.3)"
                        volumeBorderColor="#FFD700"
                    />
                </div>

                {/* Biểu đồ XAG */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        padding: '10px 0',
                        borderBottom: '1px solid #333'
                    }}>
                        <span style={{ fontSize: '20px' }}>🔔</span>
                        <h2 style={{ color: '#FFD700', margin: 0, fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {t('TradingViewChart.xagTitle')}
                        </h2>
                    </div>
                    <TradingViewChart 
                        data={tvDataXag} 
                        onZoom={handleZoom} 
                        externalZoom={sharedZoom}
                        chartLabel="XAGUSD"
                        volumeLabel="Volume XAG"
                        volumeColor="rgba(200, 200, 200, 0.3)"
                        volumeBorderColor="#ffffff"
                    />
                </div>
            </div>

            <style>{`
                @media (max-width: 900px) {
                    div[style*="gridTemplateColumns"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default CombinedXauXagChart;

