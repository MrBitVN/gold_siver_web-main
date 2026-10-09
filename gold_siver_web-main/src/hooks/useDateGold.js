import { useEffect, useMemo, useState } from "react";
import { fetchAllDirnames } from "../services/dateGoldService";

/**
 * filterOptions:
 *  {
 *     sortBy: "datetime" | "dirname",
 *     sortOrder: "asc" | "desc",
 *  }
 */
export const useDateGold = (filterOptions = {}) => {
    const [dates, setDates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const loadDates = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await fetchAllDirnames();
                console.log('dataDate', data)
                if (!cancelled) setDates(data);
            } catch (err) {
                if (!cancelled) {
                    console.error("Error loading gold dates:", err);
                    setError("Không thể tải danh sách ngày.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadDates();

        return () => {
            cancelled = true;
        };
    }, []);

    // SORT dữ liệu
    const displayedDates = useMemo(() => {
        if (!filterOptions.sortBy) return dates;

        const { sortBy, sortOrder = "asc" } = filterOptions;
        const sign = sortOrder === "asc" ? 1 : -1;

        const sorted = [...dates].sort((a, b) => {
            if (sortBy === "dirname") {
                return a.dirname.localeCompare(b.dirname) * sign;
            }
            if (sortBy === "datetime") {
                return a.datetime.localeCompare(b.datetime) * sign;
            }
            return 0;
        });

        return sorted;
    }, [dates, filterOptions]);

    // Lấy danh sách dirname cho select
    const availableDates = useMemo(() => {
        return dates.map((d) => d.dirname);
    }, [dates]);

    return {
        loading,
        error,
        displayedDates,
        availableDates,
    };
};
