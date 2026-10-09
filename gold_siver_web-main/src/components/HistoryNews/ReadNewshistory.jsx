// ReadNewsHistory.js
import React, { useEffect, useState, useMemo } from 'react';
import { getReadNewsHistory } from './newsHistoryUtils';
import { useNavigate } from 'react-router-dom';

const ReadNewsHistory = () => {
  const [history, setHistory] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setHistory(getReadNewsHistory());
  }, []);

  // parse và group theo ngày
  const parseDateSafe = (timeStr) => {
    const date = new Date(timeStr);
    return isNaN(date.getTime()) ? null : date;
  };

  const formatDateKey = (date) => {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const groupedHistory = useMemo(() => {
    return history.reduce((acc, item) => {
      const dateObj = parseDateSafe(item.timestamp);
      const dateKey = dateObj ? formatDateKey(dateObj) : "Không xác định";
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    }, {});
  }, [history]);

  const availableDates = useMemo(() => Object.keys(groupedHistory).sort((a, b) => {
    const parse = (s) => {
      const parts = s.split('/');
      return parts.length === 3 ? new Date(parts[2], parts[1] - 1, parts[0]) : new Date(0);
    }
    return parse(b) - parse(a);
  }), [groupedHistory]);

  const displayedDates = selectedDate ? [selectedDate] : availableDates;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="notification-bell bell-icon"
        onClick={() => {
          setOpen(prev => !prev);
          if (!open) setHistory(getReadNewsHistory());
        }}
      >
        ⏱️
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#000',
              borderRadius: 8,
              width: '90%',
              maxHeight: '90%',
              overflowY: 'auto',
              padding: 20,
              position: 'relative',
              color: '#fff'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Lịch sử tin đã đọc ({history.length})</h3>

            {/* Dropdown lọc ngày */}
            <div style={{ marginBottom: 15 }}>
              <select
                style={{ width: '100%', padding: '6px', borderRadius: 4, background: '#222', color: '#fff', border: '1px solid #333' }}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              >
                <option value="">Tất cả ngày ({availableDates.length})</option>
                {availableDates.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {displayedDates.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888' }}>Chưa đọc tin nào</div>
            ) : (
              displayedDates.map(date => (
                <div key={date} style={{ marginBottom: 15 }}>
                  <div style={{ fontSize: '12px', color: '#FFD700', marginBottom: 5, fontWeight: 'bold' }}>{date}</div>
                  {groupedHistory[date].map((item, idx) => (
                    <div key={idx} style={{ padding: 8, borderRadius: 6, marginBottom: 5, background: '#222' }}>
                      <div
                        onClick={() => {
                          navigate(`/tin-tuc-moi-nhat?page=${item.page || 1}&idPost=${item.id}`);
                          setOpen(false);
                        }}
                        style={{ cursor: 'pointer', color: '#fff' }}
                      >
                        {item.title} {item.author ? `(Tác giả: ${item.author})` : ""}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(item.timestamp).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              ))
            )}

            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute', top: 10, right: 10, background: 'transparent',
                border: 'none', fontSize: 18, cursor: 'pointer', color: 'red'
              }}
            >✖</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadNewsHistory;