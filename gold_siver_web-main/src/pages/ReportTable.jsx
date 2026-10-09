import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchVang247SingleFile, getVang247FileUrl } from '../services/allVang247Service';

const ReportTable = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language && i18n.language.startsWith('en') ? 'en-US' : 'vi-VN';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [xauShfeData, setXauShfeData] = useState([]);
  const [xagShfeData, setXagShfeData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // bắt đầu từ hôm nay
        let currentDate = new Date();
        let filesData = null;

        // lùi ngày cho tới khi có dữ liệu
        while (!filesData) {
          const day = String(currentDate.getDate()).padStart(2, '0');
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const year = currentDate.getFullYear();

          const days = `${day}_${month}_${year}`;

          try {
            const resFiles = await fetch(
              `https://api_gold.thinkdiff.us/all_json_1_day/${days}`
            );
            const data = await resFiles.json();

            if (data && Array.isArray(data.data) && data.data.length > 0) {
              filesData = data;
              break;
            } else {
              currentDate.setDate(currentDate.getDate() - 1);
            }
          } catch (err) {
            console.warn(`${t('ReportTable.fetchFail')} ${days}:`, err);
            currentDate.setDate(currentDate.getDate() - 1);
          }
        }

        if (!filesData) {
          throw new Error(t('ReportTable.noFileFound'));
        }

        // --- lấy file mới nhất theo modified_time ---
        const latestFile = filesData.data.reduce((latest, current) => {
          const t1 = new Date(latest.modified_time.split('/').reverse().join('-'));
          const t2 = new Date(current.modified_time.split('/').reverse().join('-'));
          return t2 > t1 ? current : latest;
        });

        const fileName = latestFile.link
        .split("/")
        .pop()
        .replace(".json", "");
        const [d, m, y, h, min] = fileName
          .split('_')
          .map(v => parseInt(v, 10));

        const fileUrl = getVang247FileUrl(d, m, y, h, min);
        if (!fileUrl) {
          throw new Error("Invalid parameters when building Vang247 file URL");
        }

        const res = await fetchVang247SingleFile(fileUrl);

        const xauData = res.data?.data_xau_shfe || [];
        const xagData = res.data?.data_xag_shfe || [];

        setXauShfeData(xauData);
        setXagShfeData(xagData);
      } catch (err) {
        setError(err.message || t('ReportTable.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  if (loading) return <div>{t('ReportTable.loading')}</div>;
  if (error) return <div>{t('ReportTable.error')}: {error}</div>;

  const notAvailable = t('ReportTable.notAvailable');

  const tableWrapperStyle = {
    width: '100%',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch', 
    marginBottom: '20px',
    border: '1px solid #444',
    borderRadius: '4px'
  };

  const tableStyle = {
    borderCollapse: 'collapse',
    width: '100%',
    minWidth: '1200px',
    fontSize: '14px'
  };

  return (
    <>
      <div style={{ padding: '10px' }}>
        <h2>{t('ReportTable.title')}</h2>
        
        <h3>{t('ReportTable.goldDataTitle')}</h3>
        {xauShfeData.length === 0 ? (
          <div>{t('ReportTable.noData')}</div>
        ) : (
          <div style={tableWrapperStyle}>
            <table className='styled-table' border="1" cellPadding="8" style={tableStyle}>
              <thead>
                <tr>
                  <th colSpan="13">
                    {t('ReportTable.updatedAt')}: <span style={{ color: '#00ff00' }}>
                      {xauShfeData[0] 
                        ? new Date(xauShfeData[0].crawl_time).toLocaleString(locale, {
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                            hour12: false
                          })
                        : t('ReportTable.notAvailable')}
                    </span>
                  </th>
                </tr>
                <tr>
                  <th>{t('ReportTable.contract')}</th> 
                  <th>{t('ReportTable.bidAsk')}</th>
                  <th>{t('ReportTable.change')}</th>
                  <th>{t('ReportTable.lastPrice')}</th>
                  <th>{t('ReportTable.limitDown')}</th>
                  <th>{t('ReportTable.limitUp')}</th>
                  <th>{t('ReportTable.lowest')}</th>
                  <th>{t('ReportTable.openInterest')}</th>
                  <th>{t('ReportTable.prevSettlement')}</th>
                  <th><span style={{ color: 'red' }}>{t('ReportTable.settlement')}</span></th>
                  <th>{t('ReportTable.symbol')}</th>
                  <th>{t('ReportTable.turnover')}</th>
                  <th>{t('ReportTable.volume')}</th>
                </tr>
              </thead>
              <tbody>
                {xauShfeData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.contract || notAvailable}</td>
                    <td>{item.bid_ask || notAvailable}</td>
                    <td>{item.change ? Number(item.change).toLocaleString() : notAvailable}</td>
                    <td>{item.last_price ? Number(item.last_price).toFixed(2) : notAvailable}</td>
                    <td>{item.limit_down ? Number(item.limit_down).toLocaleString() : notAvailable}</td>
                    <td>{item.limit_up ? Number(item.limit_up).toLocaleString() : notAvailable}</td>
                    <td>{item.lowest ? Number(item.lowest).toFixed(2) : notAvailable}</td>
                    <td>{item.open_interest ? Number(item.open_interest).toLocaleString() : notAvailable}</td>
                    <td>{item.prev_settlement ? Number(item.prev_settlement).toFixed(2) : notAvailable}</td>
                    <td>{item.settlement ? Number(item.settlement).toFixed(2) : notAvailable}</td>
                    <td>{item.symbol || notAvailable}</td>
                    <td>{item.turnover ? Number(item.turnover).toLocaleString() : notAvailable}</td>
                    <td>{item.volume ? Number(item.volume).toLocaleString() : notAvailable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h3>{t('ReportTable.silverDataTitle')}</h3>
        {xagShfeData.length === 0 ? (
          <div>{t('ReportTable.noData')}</div>
        ) : (
          <div style={tableWrapperStyle}>
            <table className='styled-table' border="1" cellPadding="8" style={tableStyle}>
              <thead>
                <tr>
                  <th colSpan="13">
                    {t('ReportTable.updatedAt')}: <span style={{ color: '#00ff00' }}>
                      {xagShfeData[0] 
                        ? new Date(xagShfeData[0].crawl_time).toLocaleString(locale, {
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                            hour12: false
                          })
                        : t('ReportTable.notAvailable')}
                    </span>
                  </th>
                </tr>
                <tr>
                  <th>{t('ReportTable.contract')}</th> 
                  <th>{t('ReportTable.bidAsk')}</th>
                  <th>{t('ReportTable.change')}</th>
                  <th>{t('ReportTable.lastPrice')}</th>
                  <th>{t('ReportTable.limitDown')}</th>
                  <th>{t('ReportTable.limitUp')}</th>
                  <th>{t('ReportTable.lowest')}</th>
                  <th>{t('ReportTable.openInterest')}</th>
                  <th>{t('ReportTable.prevSettlement')}</th>
                  <th><span style={{ color: 'red' }}>{t('ReportTable.settlement')}</span></th>
                  <th>{t('ReportTable.symbol')}</th>
                  <th>{t('ReportTable.turnover')}</th>
                  <th>{t('ReportTable.volume')}</th>
                </tr>
              </thead>
              <tbody>
                {xagShfeData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.contract || notAvailable}</td>
                    <td>{item.bid_ask || notAvailable}</td>
                    <td>{item.change ? (Number(item.change)).toLocaleString(undefined, {maximumFractionDigits:1}) : notAvailable}</td>
                    <td>{item.last_price ? (Number(item.last_price)/1000).toFixed(2) : notAvailable}</td>
                    <td>{item.limit_down ? (Number(item.limit_down)/1000).toLocaleString() : notAvailable}</td>
                    <td>{item.limit_up ? (Number(item.limit_up)/1000).toLocaleString() : notAvailable}</td>
                    <td>{item.lowest ? (Number(item.lowest)/1000).toFixed(2) : notAvailable}</td>
                    <td>{item.open_interest ? Number(item.open_interest).toLocaleString() : notAvailable}</td>
                    <td>{item.prev_settlement ? (Number(item.prev_settlement)/1000).toFixed(2) : notAvailable}</td>
                    <td>{item.settlement ? (Number(item.settlement)/1000).toFixed(2) : notAvailable}</td>
                    <td>{item.symbol || notAvailable}</td>
                    <td>{item.turnover ? (Number(item.turnover)/1000).toLocaleString() : notAvailable}</td>
                    <td>{item.volume ? (Number(item.volume)).toLocaleString() : notAvailable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default ReportTable;