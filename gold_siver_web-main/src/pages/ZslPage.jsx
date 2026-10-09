import React from 'react';
import ZslPriceChart from '../components/etf/ZslPriceChart';
import ZslComparisonChart from '../components/etf/ZslComparisonChart';

const ZslPage = () => {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: '#f1c40f' }}>ZSL — Price & Comparison</h2>

      <section style={{ marginTop: 20 }}>
        <h3 style={{ color: '#e25555', marginBottom: 12 }}>Price</h3>
        <ZslPriceChart />
      </section>

      <hr style={{ margin: '30px 0', borderColor: 'rgba(148,163,184,0.06)' }} />

      <section>
        <h3 style={{ color: '#4DA6FF', marginBottom: 12 }}>Comparison</h3>
        <ZslComparisonChart />
      </section>
    </div>
  );
};

export default ZslPage;
