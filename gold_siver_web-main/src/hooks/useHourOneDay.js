import { useEffect, useMemo, useState } from "react";
import { fetchVang247FileList } from "../services/allVang247Service";

/**
 * Parse từ dạng URL:
 * https://thinkdiff.us/vang247_xyz/17_11_2025/17_11_2025_18_54.json
 * => { day, month, year, hour, minute, second }
 */
const parseDateFromFileUrl = (link) => {
    try {
        const filename = link.split("/").pop().replace(".json", "");
        const parts = filename.split("_");

        // Trường hợp: YYYY_MM_DD_HH_mm hoặc YYYY_MM_DD_HH_mm_ss
        if (parts.length === 5) {
            const [day, month, year, hour, minute] = parts;
            return { day, month, year, hour, minute, second: null };
        }

        if (parts.length === 6) {
            const [day, month, year, hour, minute, second] = parts;
            return { day, month, year, hour, minute, second };
        }

        return null;
    } catch (e) {
        return null;
    }
};

/**
 *🟡 Hook: lấy danh sách file theo ngày + parse giờ phút
 * Chỉ lấy dữ liệu cho ngày được chỉ định, không tìm dữ liệu cũ hơn
 */
export const useVang247Dates = (day, month, year) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!day || !month || !year) {
            setLoading(false);
            setFiles([]);
            return;
        }

        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                // Chỉ lấy dữ liệu cho ngày hiện tại
                let list = [];

                try {
                    list = await fetchVang247FileList(day, month, year);
                } catch (err) {
                    // Nếu không có dữ liệu, chỉ trả về empty array
                    if (!cancelled) {
                        setFiles([]);
                        setError(null);
                    }
                    return;
                }

                if (cancelled) return;

                if (!list || list.length === 0) {
                    setFiles([]);
                    setError(null);
                    return;
                }

                // Parse giờ phút giây từ link
                const parsed = list.map((item) => {
                    const parsedDate = parseDateFromFileUrl(item.link);

                    return {
                        ...item,
                        ...parsedDate,
                    };
                });

                setFiles(parsed);
            } catch (err) {
                if (!cancelled) {
                    console.error("Error loading files:", err);
                    setError(null);
                    setFiles([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [day, month, year]);

    /**
     * Sort theo thời gian mới nhất
     */
    const pad = (n) => String(n).padStart(2, "0");
    const toTimestamp = (d) =>
        new Date(
            `${d.year}-${pad(d.month)}-${pad(d.day)}T${pad(d.hour)}:${pad(d.minute)}:${pad(d.second ?? 0)}`
        ).getTime();

    const sortedFiles = useMemo(() => {
        return [...files].sort((a, b) => toTimestamp(b) - toTimestamp(a));
    }, [files]);

    return {
        loading,
        error,
        files: sortedFiles,
    };
};
