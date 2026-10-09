export const logUserInfo = (widgetActivate = "Màn hình Home.jsx") => {
    const ua = navigator.userAgent;

    /* ================= Browser ================= */
    let browser = "Unknown";
    if (ua.includes("Chrome") && !ua.includes("Edg") && !ua.includes("OPR"))
        browser = "Chrome";
    else if (ua.includes("Edg"))
        browser = "Edge";
    else if (ua.includes("Firefox"))
        browser = "Firefox";
    else if (ua.includes("OPR") || ua.includes("Opera"))
        browser = "Opera";
    else if (ua.includes("Safari") && !ua.includes("Chrome"))
        browser = "Safari";

    /* ================= OS ================= */
    let os = "Unknown";
    if (/Windows/i.test(ua)) os = "Windows";
    else if (/Mac/i.test(ua)) os = "MacOS";
    else if (/Linux/i.test(ua)) os = "Linux";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";

    /* ================= Device Group ================= */
    const detectDeviceGroup = (ua, width, height) => {
        if (!/iphone/i.test(ua)) return "";

        const min = Math.min(width, height);
        const max = Math.max(width, height);

        if (Math.abs(min - 375) <= 5 && Math.abs(max - 667) <= 5) return "iPhone SE / 4.7-inch";
        if (Math.abs(min - 375) <= 5 && Math.abs(max - 812) <= 5) return "iPhone Mini (5.4-inch)";
        if (Math.abs(min - 390) <= 5 && Math.abs(max - 844) <= 5) return "iPhone 6.1-inch";
        if (Math.abs(min - 393) <= 5 && Math.abs(max - 852) <= 5) return "iPhone Pro 6.1-inch";
        if (Math.abs(min - 414) <= 5 && Math.abs(max - 896) <= 5) return "iPhone Plus / Max";
        if (Math.abs(min - 430) <= 5 && Math.abs(max - 932) <= 5) return "iPhone Pro Max";

        return "iPhone (Unknown)";
    };

    /* ================= Send Log ================= */
    const sendLog = async (maps) => {
        const width = window.screen.width;
        const height = window.screen.height;
        const is_mobile = Math.min(width, height) < 768 ? 1 : 0;
        const device_group = detectDeviceGroup(ua, width, height);

        const formData = new FormData();
        if (maps) formData.append("maps", JSON.stringify(maps));
        formData.append("widget_activate", widgetActivate);
        formData.append("browser_info", `${browser} ${os}`);
        formData.append("is_mobile", is_mobile);
        formData.append("width", width);
        formData.append("height", height);
        formData.append("device_group", device_group);

        try {
            console.log("[LOG] Sending log...", {
                widgetActivate,
                browser,
                os,
                is_mobile,
                width,
                height,
                device_group,
                maps
            });

            const res = await fetch("https://api_gold.thinkdiff.us/check_data_pro", {
                method: "POST",
                body: formData
            });

            console.log("[LOG] Server response:", res.status);
        } catch (err) {
            console.error("[LOG] Fetch error:", err);
        }
    };

    /* ================= Geolocation ================= */
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            console.log("[LOG] Geolocation OK", pos.coords);
            sendLog({
                lat: pos.coords.latitude,
                long: pos.coords.longitude
            });
        },
        (err) => {
            console.warn("[LOG] Geolocation FAILED", err.code, err.message);
            sendLog(null); // vẫn log dù bị chặn GPS
        },
        { timeout: 5000 }
    );
};
