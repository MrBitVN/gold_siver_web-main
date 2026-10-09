import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Import hook điều hướng
import CombinedXauXagChart from '../components/tradingview/CombinedXauXagChart';
import { fetchXauXagVolumeDataMultiplePages, fetchXauXagVolumeData } from '../services/volumeChartDataService';
import { formatCandlestickForApex } from '../utils/convertDataXauXagHelper';
import { logUserInfo } from '../utils/logUserInfo';
import VolumeComparisonChart from '../components/tradingview/VolumeComparisonChart';
import GrowthChart from '../components/tradingview/GrowthChart';
import XAGVolumeOnlyChart from '../components/tradingview/XAGVolumeOnlyChart';
import { useTranslation } from "react-i18next";
const CombinedXauXagChartPage = () => {
  const { t } = useTranslation();
  const [dataXau, setDataXau] = useState(null);
  const [dataXag, setDataXag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avgVolumeXau, setAvgVolumeXau] = useState(0);
  const [avgVolumeXag, setAvgVolumeXag] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [volumeZoomState, setVolumeZoomState] = useState(null);
  const accumulatedXauRawRef = useRef([]);
  const accumulatedXagRawRef = useRef([]);

  const navigate = useNavigate(); // Khởi tạo hàm điều hướng

  const pageSize = 100; // Giả sử 1 page server trả 100 record
  const defaultVisiblePages = 3; // Mặc định load 3 page đầu

  const handleVolumeZoom = useCallback((newZoomState) => {
    setVolumeZoomState(newZoomState);
  }, []);

  useEffect(() => {
    logUserInfo("Trang CombinedXauXagChart");
  }, []);

  // fetch 3 page đầu
  useEffect(() => {
    let cancelled = false;

    const fetchInitialVolume = async () => {
      try {
        setLoading(true);

        // Fetch 3 page đầu tiên
        const page1 = await fetchXauXagVolumeData(1);
        const page2 = await fetchXauXagVolumeData(2);
        const page3 = await fetchXauXagVolumeData(3);

        if (cancelled) return;

        accumulatedXauRawRef.current = [
          ...(page1.volumeXauRaw || []),
          ...(page2.volumeXauRaw || []),
          ...(page3.volumeXauRaw || [])
        ];

        accumulatedXagRawRef.current = [
          ...(page1.volumeXagRaw || []),
          ...(page2.volumeXagRaw || []),
          ...(page3.volumeXagRaw || [])
        ];

        const totalPagesCount = page1?.totalPages || 0;
        setTotalPages(totalPagesCount);
        setCurrentPage(3);
        setHasMoreData(totalPagesCount > 3);

        setAvgVolumeXau(page1.volume_trungbinh?.xau || 0);
        setAvgVolumeXag(page1.volume_trungbinh?.xag || 0);

        // Chỉ hiển thị 3 page đầu
        const initialDataXau = accumulatedXauRawRef.current.slice(0, defaultVisiblePages * pageSize);
        const initialDataXag = accumulatedXagRawRef.current.slice(0, defaultVisiblePages * pageSize);

        setDataXau(formatCandlestickForApex(initialDataXau));
        setDataXag(formatCandlestickForApex(initialDataXag));

        const allTimestamps = [
          ...accumulatedXauRawRef.current.map(i => i.timestamp),
          ...accumulatedXagRawRef.current.map(i => i.timestamp)
        ];
        const minTimestamp = Math.min(...allTimestamps);
        const maxTimestamp = Math.max(...allTimestamps);

        const sortedXau = [...accumulatedXauRawRef.current].sort((a, b) => b.timestamp - a.timestamp);
        const initialMinTimeIndex = Math.max(0, sortedXau.length - 30);
        const initialMinTime = sortedXau[initialMinTimeIndex]?.timestamp || minTimestamp;

        setTimeout(() => setVolumeZoomState({ min: initialMinTime, max: maxTimestamp }), 300);
      } catch (error) {
        console.error("Error fetching volume data:", error);
        if (!cancelled) {
          setDataXau([]);
          setDataXag([]);
          setAvgVolumeXau(0);
          setAvgVolumeXag(0);
          setError(t("VolumePage.error"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchInitialVolume();

    return () => { cancelled = true; };
  }, []);

  // ---------------------------------------------------------------------
  // Hàm Load tiếp 3 page
  // ---------------------------------------------------------------------
  const loadNextPages = async () => {
    if (isLoadingMore || !hasMoreData) return;

    const nextStart = currentPage + 1;
    const nextEnd = Math.min(currentPage + 3, totalPages);

    setIsLoadingMore(true);

    try {
      await fetchXauXagVolumeDataMultiplePages(nextStart, nextEnd, (page, data) => {
        accumulatedXauRawRef.current = [...accumulatedXauRawRef.current, ...data.volumeXauRaw];
        accumulatedXagRawRef.current = [...accumulatedXagRawRef.current, ...data.volumeXagRaw];

        const uniqueXau = Array.from(new Map(accumulatedXauRawRef.current.map(item => [item.timestamp, item])).values());
        const uniqueXag = Array.from(new Map(accumulatedXagRawRef.current.map(item => [item.timestamp, item])).values());

        setDataXau(formatCandlestickForApex(uniqueXau));
        setDataXag(formatCandlestickForApex(uniqueXag));

        setCurrentPage(page);
        setHasMoreData(page < totalPages);
      });
    } catch (error) {
      console.error("Error loading more pages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // ---------------------------------------------------------------------
  // Hàm Load tất cả page còn lại
  // ---------------------------------------------------------------------
  const loadAllPages = async () => {
    if (isLoadingMore || !hasMoreData) return;

    setIsLoadingMore(true);

    try {
      await fetchXauXagVolumeDataMultiplePages(currentPage + 1, totalPages, (page, data) => {
        accumulatedXauRawRef.current = [...accumulatedXauRawRef.current, ...data.volumeXauRaw];
        accumulatedXagRawRef.current = [...accumulatedXagRawRef.current, ...data.volumeXagRaw];

        const uniqueXau = Array.from(new Map(accumulatedXauRawRef.current.map(item => [item.timestamp, item])).values());
        const uniqueXag = Array.from(new Map(accumulatedXagRawRef.current.map(item => [item.timestamp, item])).values());

        setDataXau(formatCandlestickForApex(uniqueXau));
        setDataXag(formatCandlestickForApex(uniqueXag));

        setCurrentPage(page);
        setHasMoreData(false);
      });
    } catch (error) {
      console.error("Error loading all pages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // fetch hiện tại
  const resetToInitialPages = useCallback(async () => {
    try {
      setIsLoadingMore(true);
      const firstPage = await fetchXauXagVolumeData(1);
      const secondPage = await fetchXauXagVolumeData(2);
      const thirdPage = await fetchXauXagVolumeData(3);

      accumulatedXauRawRef.current = [
        ...(firstPage.volumeXauRaw || []),
        ...(secondPage.volumeXauRaw || []),
        ...(thirdPage.volumeXauRaw || [])
      ];
      accumulatedXagRawRef.current = [
        ...(firstPage.volumeXagRaw || []),
        ...(secondPage.volumeXagRaw || []),
        ...(thirdPage.volumeXagRaw || [])
      ];

      const allTimestamps = [
        ...accumulatedXauRawRef.current.map(d => d.timestamp),
        ...accumulatedXagRawRef.current.map(d => d.timestamp)
      ];

      const minTimestamp = Math.min(...allTimestamps);
      const maxTimestamp = Math.max(...allTimestamps);

      setDataXau(formatCandlestickForApex(accumulatedXauRawRef.current));
      setDataXag(formatCandlestickForApex(accumulatedXagRawRef.current));
      setCurrentPage(3);
      setHasMoreData(totalPages > 3);

      // Reset zoom về mặc định 3 page đầu
      const sortedXau = accumulatedXauRawRef.current.slice().sort((a, b) => b.timestamp - a.timestamp);
      const initialMinTime = sortedXau[Math.max(0, sortedXau.length - 30)]?.timestamp || minTimestamp;
      setVolumeZoomState({ min: initialMinTime, max: maxTimestamp });
    } catch (error) {
      console.error("Error resetting to initial pages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [totalPages]);

  // Hàm xử lý khi click vào tiêu đề
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>{t("VolumePage.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', width: '100%' }}>
      <h1
        style={{
          marginBottom: '20px',
          display: 'inline-block', // Giới hạn vùng click vừa đủ tiêu đề
          transition: 'color 0.2s'
        }}
      >
        {t("VolumePage.title")}
      </h1>

      <div style={{ width: '100%' }}>
        <CombinedXauXagChart
          dataXau={dataXau}
          dataXag={dataXag}
          externalZoom={volumeZoomState}
          onZoom={handleVolumeZoom}
          enableZoom={true}
        />

        {/* Nút Load tiếp & Load tất cả */}
        {hasMoreData && (
          <div className="pagination-actions">
            <button
              className="action-button"
              onClick={loadNextPages}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? t("VolumePage.loading") : t("VolumePage.next")}
            </button>
            <button
              className="action-button"
              onClick={loadAllPages}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? t("VolumePage.loading") : t("VolumePage.all")}
            </button>
          </div>
        )}
        <button
          className="action-button single"
          onClick={resetToInitialPages}
          disabled={isLoadingMore}
        >
          {t("VolumePage.current")}
        </button>

        <VolumeComparisonChart
          dataXau={dataXau}
          dataXag={dataXag}
          avgVolumeXau={avgVolumeXau}
          avgVolumeXag={avgVolumeXag}
          externalZoom={volumeZoomState}
          onZoom={handleVolumeZoom}
          enableZoom={true}
        />

        <GrowthChart />

        <XAGVolumeOnlyChart data={dataXag} />
      </div>
    </div>
  );
};

export default CombinedXauXagChartPage;