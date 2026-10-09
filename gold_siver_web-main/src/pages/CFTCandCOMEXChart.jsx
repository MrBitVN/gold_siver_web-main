import React from 'react';
// Import các biểu đồ của bạn vào đây
import CFTC_Chart from '../components/cftc-chart/CFTC_Chart';
 import ReportComexChart from '../components/report-comex/ReportComexChart';

const CFTCandCOMEXChart = () => {
  return (
    <div className="cftc-comex-container" style={{ padding: '20px', color: 'white' }}>
     

      {/* Phần Báo cáo Vị thế CFTC */}
      <section style={{ marginBottom: '50px', background: '#1e293b', padding: '20px', borderRadius: '8px' }}>
        
        <div style={{ paddingTop: '25px' }}>
          <CFTC_Chart />
        </div>
      </section>

      {/* Phần Báo cáo Tồn kho Comex */}
      <section style={{ background: '#1e293b', padding: '20px', borderRadius: '8px' }}>
       
        <div style={{ paddingTop: '25px' }}>
          <ReportComexChart />
        </div>
      </section>
    </div>
  );
};

export default CFTCandCOMEXChart;