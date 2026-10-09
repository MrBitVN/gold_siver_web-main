import React, { useMemo } from 'react';
import { heatmapData } from './symbolsConfig';

const SectorBarChart = ({ stocksData, selectedSector, onSectorClick, data = heatmapData }) => {
  const sectorData = useMemo(() => {
    if (!data || !data.children) return [];
    
    return data.children.map(sector => {
      let weightedSum = 0;
      let totalWeight = 0;
      let count = 0;
      
      const traverse = (node) => {
        if (node.symbol) {
          const stock = stocksData[node.symbol];
          const weight = node.weight || 1;
          // Align calculation logic with MoneyFlowHeatmap.jsx: default to 0% if stock not loaded yet
          const change = stock ? (stock.changePercent || 0) : 0;
          weightedSum += change * weight;
          totalWeight += weight;
          count++;
        }
        if (node.children) node.children.forEach(traverse);
      };
      
      traverse(sector);
      const performance = totalWeight > 0 ? weightedSum / totalWeight : 0;
      
      return {
        name: sector.name,
        performance: performance,
        count: count
      };
    }).sort((a, b) => b.performance - a.performance);
  }, [stocksData, data]);

  // Tính toán giới hạn trục Y (tối thiểu là 1%)
  const maxAbs = Math.max(...sectorData.map(s => Math.abs(s.performance)), 1.0);

  return (
    <div className="sector-bar-container" style={{ 
      padding: '20px', 
      background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 30, 0.98) 100%)', 
      borderRadius: '12px', 
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ color: '#f8fafc', margin: 0, fontSize: '15px', fontWeight: '800', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          HIỆU SUẤT DÒNG VỐN NHÓM NGÀNH (%)
        </h4>
        <span style={{ color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>Chọn cột để lọc dữ liệu bản đồ</span>
      </div>
      
      <div className="bar-chart-area" style={{ 
        height: '220px', 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center',
        padding: '0 5px',
        marginTop: '10px'
      }}>
        {/* Grid lines */}
        {[maxAbs, maxAbs/2, 0, -maxAbs/2, -maxAbs].map((tick, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${50 - (tick/maxAbs * 50)}%`,
            height: '1px',
            background: tick === 0 ? 'rgba(100, 116, 139, 0.5)' : 'rgba(255,255,255,0.03)',
            zIndex: 1
          }} />
        ))}
        
        <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', zIndex: 2 }}>
          {sectorData.map(sector => {
            const isPos = sector.performance >= 0;
            const heightPct = (Math.abs(sector.performance) / maxAbs) * 50; 
            const isActive = selectedSector === sector.name;

            return (
              <div 
                key={sector.name}
                onClick={() => onSectorClick(sector.name)}
                className="sector-bar-item"
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: selectedSector && !isActive ? 0.3 : 1,
                  transform: isActive ? 'scale(1.02)' : 'none',
                }}
              >
                {/* Bar Top (Positive) */}
                <div style={{ flex: 1, width: '65%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  {isPos && (
                    <div style={{ 
                      height: `${Math.max(heightPct, 3)}%`, 
                      width: '100%', 
                      background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)', 
                      borderRadius: '4px 4px 0 0',
                      boxShadow: isActive ? '0 0 20px rgba(34, 197, 94, 0.5)' : 'none'
                    }} />
                  )}
                </div>

                {/* Center Label */}
                <div style={{ 
                  height: '55px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '100%',
                  zIndex: 3,
                  padding: '5px 0'
                }}>
                  <div style={{ 
                    fontSize: '10px', 
                    color: isActive ? '#fff' : '#94a3b8',
                    fontWeight: isActive ? '900' : '600',
                    textAlign: 'center',
                    lineHeight: '1.2',
                    maxWidth: '85%',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis'
                  }}>
                    {sector.name}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: isPos ? '#22c55e' : '#ef4444', 
                    fontWeight: '800',
                    marginTop: '2px'
                  }}>
                    {isPos ? '+' : ''}{sector.performance.toFixed(2)}%
                  </div>
                </div>

                {/* Bar Bottom (Negative) */}
                <div style={{ flex: 1, width: '65%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                  {!isPos && (
                    <div style={{ 
                      height: `${Math.max(heightPct, 3)}%`, 
                      width: '100%', 
                      background: 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)', 
                      borderRadius: '0 0 4px 4px',
                      boxShadow: isActive ? '0 0 20px rgba(239, 68, 68, 0.5)' : 'none'
                    }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SectorBarChart;
