import React from 'react';
import TradeTable from '../components/TradeTable/TradeTable';
import ShareChartMetalPage from './ShareChartMetalPage';
import SLVTradingChart from './SLVTradingChart';
import SLVStats from './SLVStatsCard';
import SLVDarkPoolTable from './SLVDarkPoolTable';
import SLVAvailabilityTable from '../components/SLVAvailabilityTable/SLVAvailabilityTable';
import SLVVolumeCombinedTable from '../components/SLVAvailabilityTable/SLVVolumeCombinedTable';
import SLVBorrowFeesTable from '../components/SLVAvailabilityTable/SLVBorrowFeesTable';
import SLVFailsToDeliverTable from '../components/SLVAvailabilityTable/SLVFailsToDeliverTable';
import SLVShortInterestTable from '../components/SLVAvailabilityTable/SLVShortInterestTable';

export default function TradeFlowPage() {
  return (
    <div className="tradeflow-page">
      <TradeTable apiUrl="https://api_gold.thinkdiff.us/slv_short_long" />
      <div style={{ paddingBottom: "45px", paddingTop: '25px' }}>
        <ShareChartMetalPage />
      </div>
      <SLVAvailabilityTable />
      <SLVBorrowFeesTable />
      <SLVVolumeCombinedTable />
      <SLVFailsToDeliverTable/>
      <SLVShortInterestTable />
      
      <div className="slv-section">
        <SLVTradingChart />
        <SLVStats />
        <SLVDarkPoolTable />
      </div>
    </div>
  );
}
