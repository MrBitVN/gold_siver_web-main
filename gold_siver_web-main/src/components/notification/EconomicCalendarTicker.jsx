import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, Tag, Empty } from 'antd';
import ReactCountryFlag from 'react-country-flag';
import './EconomicCalendarTicker.css';
import { useTranslation } from 'react-i18next';

const API_URL = 'https://api_gold.thinkdiff.us/lich_kinh_te_taichinh';
const CYCLE_TIME = 30000; // 30 seconds

const EconomicCalendarTicker = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTickerVisible, setIsTickerVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visibleClass, setVisibleClass] = useState('hide');

  const fetchEvents = useCallback(async () => {
    try {
      const response = await axios.get(API_URL);
      const data = response.data || [];

      const today = new Date();
      const next7Days = new Date();
      next7Days.setDate(today.getDate() + 7);

      const filtered = data.filter(event => {
        const eventDate = new Date(event.event_time_vn);
        return eventDate >= today && eventDate <= next7Days;
      }).sort((a, b) => new Date(a.event_time_vn) - new Date(b.event_time_vn));

      setEvents(filtered);
    } catch (error) {
      console.error('Error fetching economic calendar:', error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const refreshInterval = setInterval(fetchEvents, 300000);
    return () => clearInterval(refreshInterval);
  }, [fetchEvents]);

  useEffect(() => {
    if (events.length === 0) return;

    // "Bắn ra" every 30 seconds
    const cycleTimer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
      setIsTickerVisible(true);
      setVisibleClass('show');
      setProgress(0);

      // Auto-hide after 12 seconds
      setTimeout(() => {
        setVisibleClass('hide');
        setTimeout(() => setIsTickerVisible(false), 500); // Wait for animation
      }, 12000);
    }, CYCLE_TIME);

    // Initial trigger
    setIsTickerVisible(true);
    setVisibleClass('show');
    setTimeout(() => {
      setVisibleClass('hide');
      setTimeout(() => setIsTickerVisible(false), 500);
    }, 12000);

    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.min(prev + (100 / (12000 / 100)), 100));
    }, 100);

    return () => {
      clearInterval(cycleTimer);
      clearInterval(progressTimer);
    };
  }, [events]);

  if (events.length === 0) return null;

  const currentEvent = events[currentIndex];

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' +
      date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const getImpactClass = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'impact-high';
      case 'medium': return 'impact-medium';
      case 'low': return 'impact-low';
      default: return '';
    }
  };

  return (
    <>
      {isTickerVisible && (
        <div className={`economic-calendar-ticker ${visibleClass}`}>
          <div
            className={`ticker-card ${getImpactClass(currentEvent.impact_level)}`}
            onClick={() => setIsModalOpen(true)}
          >
            <div className="ticker-close" onClick={(e) => {
              e.stopPropagation();
              setVisibleClass('hide');
            }}>✕</div>

            <div className="ticker-header">
              <div className="ticker-time-highlight">
                <span className="time-icon">⏰</span>
                {formatTime(currentEvent.event_time_vn)}
              </div>
              <div className="ticker-country-badge">
                <ReactCountryFlag
                  countryCode={currentEvent.country_code}
                  svg
                  style={{ width: '16px', height: '12px', borderRadius: '2px' }}
                />
                <span>{currentEvent.country_code}</span>
              </div>
            </div>

            <div className="ticker-event-name">
              {currentEvent.event_name}
            </div>

            <div className="ticker-metrics-grid">
              <div className="metric-box">
                <span className="m-label">{t('EconomicCalendar.forecast', 'FORECAST')}</span>
                <span className="m-value">{currentEvent.forecast_value || '-'}</span>
              </div>
              <div className="metric-box">
                <span className="m-label">{t('EconomicCalendar.previous', 'PREVIOUS')}</span>
                <span className="m-value">{currentEvent.previous_value || '-'}</span>
              </div>
              <div className="metric-box">
                <span className="m-label">{t('EconomicCalendar.impact', 'IMPACT')}</span>
                <Tag color={currentEvent.impact_level?.toLowerCase() === 'high' ? '#ff4d4f' : '#ffd700'} className="impact-tag-mini">
                  {currentEvent.impact_level}
                </Tag>
              </div>
            </div>

            <div className="ticker-progress-container">
              <div className="ticker-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      )}

      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={1000}
        className="economic-calendar-modal-premium"
        centered
        destroyOnHidden
        styles={{
          mask: { backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.85)' },
          content: { background: 'transparent', boxShadow: 'none', padding: 0, border: 'none' }
        }}
      >
        <div className="ec-premium-container">
          <div className="ec-premium-header">
            <div className="header-glitch-wrapper">
              <span className="header-icon">📡</span>
              <h2 className="header-title">{t('EconomicCalendar.title', 'ECONOMIC CALENDAR')}</h2>
              <div className="header-tag">MARKET INTELLIGENCE</div>
            </div>
            <div className="header-right">
              <div className="header-status">
                <span className="status-dot"></span>
                REAL-TIME FEED
              </div>
              <button className="ec-premium-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
          </div>

          <div className="ec-premium-content custom-scrollbar">
            {events.length > 0 ? (
              <div className="ec-grid">
                {events.map((event, idx) => (
                  <div key={idx} className={`ec-card impact-${event.impact_level?.toLowerCase()}`}>
                    <div className="card-top">
                      <div className="card-time-group">
                        <span className="time-val">{formatTime(event.event_time_vn).split(' ')[0]}</span>
                        <span className="date-val">{formatTime(event.event_time_vn).split(' ')[1]}</span>
                      </div>
                      <div className="card-impact-badge">
                        {event.impact_level}
                      </div>
                      <div className="card-country">
                        <ReactCountryFlag countryCode={event.country_code} svg className="country-flag" />
                        <span className="country-code">{event.country_code}</span>
                      </div>
                    </div>

                    <div className="card-main">
                      <h3 className="event-name">{event.event_name}</h3>

                      <div className="event-metrics">
                        <div className="metric-item actual">
                          <label>{t('EconomicCalendar.actual', 'ACTUAL')}</label>
                          <span className="value">{event.actual_value || '---'}</span>
                        </div>
                        <div className="metric-item forecast">
                          <label>{t('EconomicCalendar.forecast', 'FORECAST')}</label>
                          <span className="value">{event.forecast_value || '---'}</span>
                        </div>
                        <div className="metric-item previous">
                          <label>{t('EconomicCalendar.previous', 'PREVIOUS')}</label>
                          <span className="value">{event.previous_value || '---'}</span>
                        </div>
                      </div>
                    </div>

                    {(event.description || event.analysis || event.impact_desc) && (
                      <div className="card-expanded-intel">
                        <div className="intel-header">{t('EconomicCalendar.analyticsTitle', 'ANALYTICS & IMPLICATIONS')}</div>
                        {event.description && <div className="intel-row"><span className="row-icon">📋</span> {event.description}</div>}
                        {event.impact_desc && <div className="intel-row"><span className="row-icon">⚡</span> {event.impact_desc}</div>}
                        {event.analysis && <div className="intel-row"><span className="row-icon">🔍</span> {event.analysis}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="ec-premium-empty">
                <Empty description={<span style={{ color: 'rgba(0,242,255,0.5)', letterSpacing: '2px' }}>NO UPCOMING INTELLIGENCE FOUND</span>} />
              </div>
            )}
          </div>

          <div className="ec-premium-footer">
            <div className="footer-info">{t('EconomicCalendar.windowActive', '7-DAY FORECAST WINDOW ACTIVE')}</div>
            <div className="footer-branding">{t('EconomicCalendar.branding', 'WHALE INTELLIGENCE v4.0')}</div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EconomicCalendarTicker;
