import { useState, useEffect, useMemo } from "react";
import { getVang247FileUrl } from "../services/allVang247Service";

export const useVang247Prices = (filterOptions, day, month, year, hour, minute, second) => {
    const [allPrices, setAllPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const url = getVang247FileUrl(day, month, year, hour, minute, second);
                if (!url) {
                    throw new Error('useVang247Prices: invalid parameters for getVang247FileUrl');
                }
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                // data giả sử đã có cấu trúc như allPrices cũ
                setAllPrices(data.vendors || []);
            } catch (err) {
                console.error(err);
                setError("Không thể tải dữ liệu Vang247.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [day, month, year, hour, minute, second]);

    const displayedPrices = useMemo(() => {
        if (!allPrices) return [];
        // filter + sort như cũ
        return allPrices
            .map(vendor => ({
                ...vendor,
                items: vendor.items.filter(item => {
                    const t = item.TYPE?.toUpperCase();
                    if (filterOptions.type === "gold") return t === "VANG" || t === "GOLD";
                    if (filterOptions.type === "silver") return t === "BAC" || t === "SILVER";
                    return true;
                }),
            }))
            .filter(v => v.items.length > 0);
    }, [allPrices, filterOptions]);

    const lastUpdated = useMemo(() => {
        if (!allPrices.length) return "";
        return allPrices.reduce((latest, curr) => {
            return new Date(curr.timestamp) > new Date(latest.timestamp) ? curr : latest;
        }, allPrices[0]).timestamp;
    }, [allPrices]);

    const availableCountries = useMemo(() => {
        const countries = new Set();
        allPrices.forEach(v => v.quoc_gia && countries.add(v.quoc_gia));
        return Array.from(countries).sort();
    }, [allPrices]);

    return { loading, error, displayedPrices, lastUpdated, availableCountries };
};
