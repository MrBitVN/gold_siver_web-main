import React, { useEffect, useState } from "react";
import IGInstrumentInfo from "./IGInstrumentInfo";
import IGMarginTable from "./IGMarginTable";
import "./IGInstrumentBlock.css";

const IGInstrumentBlock = () => {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const pickLatestByDateOrFallback = (arr) => {
      const objs = arr.filter(it => it && typeof it === 'object');
      if (objs.length === 0) return null;

      const withDates = objs.map(it => {
        const raw = it.ngay_tao || it.created_at || null;
        const ts = raw ? new Date(String(raw).replace(' ', 'T')).getTime() : NaN;
        return { it, ts };
      });

      const validDates = withDates.filter(x => !Number.isNaN(x.ts));
      if (validDates.length > 0) {
        validDates.sort((a, b) => b.ts - a.ts);
        return validDates[0].it;
      }

      for (let i = objs.length - 1; i >= 0; i--) {
        const it = objs[i];
        if ('min_size' in it || 'contract_size' in it || 'one_pip_means' in it || 'symbol' in it || 'gia_sell' in it) {
          return it;
        }
      }

      return objs[objs.length - 1];
    };

    const fetchData = async () => {
      try {
        const res = await fetch("https://api_gold.thinkdiff.us/ig_sentiment");
        const data = await res.json();
        let latest = null;
        if (data && Array.isArray(data.ig_sentiment) && data.ig_sentiment.length > 0) {
          latest = pickLatestByDateOrFallback(data.ig_sentiment);
        } else if (Array.isArray(data) && data.length > 0) {
          latest = pickLatestByDateOrFallback(data);
        } else if (data && typeof data === 'object') {
          latest = data;
        }
        if (latest) setInfo(latest);
      } catch (err) {
        console.error('Fetch instrument block error', err);
      }
    };

    fetchData();
  }, []);

  if (!info) return null;

  return (
    <div className="instrument-block">
      <div className="instrument-left">
        <IGInstrumentInfo info={info} />
      </div>

      <div className="instrument-right">
        <IGMarginTable raw={info.margin_full_table} />
      </div>
    </div>
  );
};

export default IGInstrumentBlock;
