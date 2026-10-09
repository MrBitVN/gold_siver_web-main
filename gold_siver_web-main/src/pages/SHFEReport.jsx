import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const SHFEReport = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const locale = i18n.language && i18n.language.startsWith('en') ? 'en-US' : 'vi-VN';
  const [shfeData, setShfeData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          'https://api_gold.thinkdiff.us/shfe_luong_luutru'
        );

        if (!response.ok) {
          throw new Error(t('SHFEReport.loadError'));
        }

        const result = await response.json();

        // dữ liệu gốc từ API
        const data =
          result.data || result.chi_so_fomo_vang || [];

        setShfeData(data);
      } catch (err) {
        setError(err.message || t('SHFEReport.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>{t('SHFEReport.loading')}</div>;
  if (error) return <div>{t('SHFEReport.error')}: {error}</div>;

  // 👉 TÁCH DỮ LIỆU
  const goldData = shfeData.filter(item => item.commodity === 'GOLD');
  const silverData = shfeData.filter(item => item.commodity === 'SILVER');

  const tableWrapperStyle = {
    width: '100%',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    marginBottom: '30px',
    border: '1px solid #444',
    borderRadius: '4px'
  };

  const tableStyle = {
    borderCollapse: 'collapse',
    width: '100%',
    minWidth: '1200px',
    fontSize: '14px'
  };

  const notAvailable = t('SHFEReport.notAvailable');

  const renderTable = (data, title) => (
    <>
      <h3>{title}</h3>
      {data.length === 0 ? (
        <div>{t('SHFEReport.noData')}</div>
      ) : (
        <div style={tableWrapperStyle}>
          <table className="styled-table" border="1" cellPadding="5" style={tableStyle}>
            <thead>
              <tr>
                <th colSpan="6">
                  {t('SHFEReport.updatedAt')}{' '}
                  <span style={{ color: '#00ff00' }}>
                    {new Date(data[0].report_date).toLocaleString(locale, {
                      weekday: 'long',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                    })}
                  </span>
                </th>
              </tr>
              <tr>
                <th>{t('SHFEReport.changeLevel')}</th>
                <th>{t('SHFEReport.commodity')}</th>
                <th>{t('SHFEReport.quantity')}</th>
                <th>{t('SHFEReport.region')}</th>
                <th>{t('SHFEReport.warehouse')}</th>
                <th>{t('SHFEReport.time')}</th>
              </tr>
            </thead>
            <tbody style={{textAlign: "center"}}>
              {data.map((item, index) => (
                <tr key={index}>
                  <td>{item.change_val ?? notAvailable}</td>
                  <td>{item.commodity ?? notAvailable}</td>
                  <td>
                    {item.on_warrant
                      ? Number(item.on_warrant).toLocaleString()
                      : notAvailable}
                  </td>
                  <td>{item.region ?? notAvailable}</td>
                  <td>{item.warehouse ?? notAvailable}</td>
                  <td>
                    {item.report_date
                      ? new Date(item.report_date).toLocaleString(locale, {
                          weekday: 'long',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : notAvailable}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  return (
    <div style={{ padding: '10px' }}>
      <h2>{t('SHFEReport.title')}</h2>

      {renderTable(goldData, t('SHFEReport.goldData'))}
      {renderTable(silverData, t('SHFEReport.silverData'))}
    </div>
  );
};

export default SHFEReport;
