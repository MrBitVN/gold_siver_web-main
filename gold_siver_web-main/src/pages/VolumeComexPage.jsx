import { useEffect, useState } from "react";
import SilverVolume from "../components/report-comex/SilverVolume";
import ComexVolumeAnalysis from "../components/report-comex/ComexVolumeAnalysis";
import { safeJsonFetch } from "../utils/apiHelper";

function VolumeComexPage() {
  const [labels, setLabels] = useState(null);
  const [dataSilverOption, setDataSilverOption] = useState(null);
  const [dataSilverFuture, setDataSilverFuture] = useState(null);

  const [analysisData, setAnalysisData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Volume Data
        const dataVol = await safeJsonFetch(
          "https://api_gold.thinkdiff.us/volume_comex_silver",
        );
        
        // Fetch Analysis Data
        const dataAnalysis = await safeJsonFetch(
          "https://api_gold.thinkdiff.us/phantich_silver_history",
        );

        if (dataAnalysis && dataAnalysis.comex_volume_analysis) {
          setAnalysisData(dataAnalysis.comex_volume_analysis);
        }

        if (dataVol && Array.isArray(dataVol.data) && dataVol.data.length > 0) {
          // Sort items by date descending (new -> old)
          const items = [...dataVol.data].filter(Boolean).sort((a, b) => {
            const ta = a && a.date ? new Date(a.date).getTime() : 0;
            const tb = b && b.date ? new Date(b.date).getTime() : 0;
            return tb - ta;
          });

          const labels = [];
          const silverOption = [];
          const silverFuture = [];

          items.forEach((item) => {
            if (
              !item ||
              !item.date ||
              item.oi_option === null ||
              item.optionVolume_option === null ||
              item.futureOi === null ||
              item.futureVolume === null
            ) {
              return;
            }

            labels.push(item.date);
            silverOption.push({
              oi: item.oi_option,
              vol: item.optionVolume_option,
            });
            silverFuture.push({
              oi: item.futureOi,
              vol: item.futureVolume,
            });
          });

          setLabels(labels);
          setDataSilverOption(silverOption);
          setDataSilverFuture(silverFuture);
        }
      } catch (error) {
        console.error("Lỗi khi fetch dữ liệu:", error);
      }
    };

    fetchData();
  }, []);

  if (!analysisData && !labels) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {analysisData && (
        <div style={{ marginBottom: '30px' }}>
          <ComexVolumeAnalysis data={analysisData} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: '30px' }}>
        {labels && dataSilverOption && (
          <div className="volume-chart-section">
            <SilverVolume
              type="silverOption"
              labels={labels}
              data={dataSilverOption}
            />
          </div>
        )}
        {labels && dataSilverFuture && (
          <div className="volume-chart-section">
            <SilverVolume
              type="silverFuture"
              labels={labels}
              data={dataSilverFuture}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default VolumeComexPage;
