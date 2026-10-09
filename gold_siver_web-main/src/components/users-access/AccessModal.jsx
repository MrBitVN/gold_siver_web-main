import { useTranslation } from 'react-i18next';
import "./AccessModal.css"
const parseUserAgent = (ua) => {
    ua = ua.toLowerCase();

    // 2. Detect OS
    let os = "Unknown";

    if (ua.includes("windows nt")) os = "Windows";
    else if (ua.includes("mac os x") && !ua.includes("iphone")) os = "MacOS";
    else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS (Iphone)";
    else if (ua.includes("android")) os = "Android";
    else if (ua.includes("linux")) os = "Linux";
    else os = "Postman"

    return `${os}`;
}

// Helper function để parse thông tin địa chỉ từ IP location
const parseIpLocation = (ipLocationStr) => {
    try {
        if (!ipLocationStr || typeof ipLocationStr !== 'string') {
            return {
                isp: 'Unknown',
                country_name: 'Unknown',
                region_name: 'Unknown'
            };
        }

        // Chuyển string JSON (với single quotes) thành object
        // Thay thế single quotes bằng double quotes và None thành null
        let jsonStr = ipLocationStr.replace(/'/g, '"').replace(/None/g, 'null');
        const parsed = JSON.parse(jsonStr);
        
        return {
            isp: parsed.isp || 'Unknown',
            country_name: parsed.country_name || 'Unknown',
            region_name: parsed.region_name || 'Unknown'
        };
    } catch (e) {
        console.error("Error parsing IP location:", e);
        return {
            isp: 'Unknown',
            country_name: 'Unknown',
            region_name: 'Unknown'
        };
    }
};

// Function để detect iPhone model từ screen size
const detectiPhoneModel = (width, height) => {
    const [minDim, maxDim] = [Math.min(width, height), Math.max(width, height)];

    const iPhoneModels = [
        { name: "iPhone 17", width: 393, height: 852 },
        { name: "iPhone Air", width: 414, height: 896 },
        { name: "iPhone 17 Pro", width: 393, height: 852 },
        { name: "iPhone 17 Pro Max", width: 430, height: 932 },
        { name: "iPhone 16 Pro Max", width: 430, height: 932 },
        { name: "iPhone 16 Pro", width: 393, height: 852 },
        { name: "iPhone 16 Plus", width: 414, height: 896 },
        { name: "iPhone 16", width: 393, height: 852 },
        { name: "iPhone 15 Pro Max", width: 430, height: 932 },
        { name: "iPhone 15 Pro", width: 393, height: 852 },
        { name: "iPhone 15 Plus", width: 414, height: 896 },
        { name: "iPhone 15", width: 393, height: 852 },
        { name: "iPhone 14 Pro Max", width: 430, height: 932 },
        { name: "iPhone 14 Pro", width: 393, height: 852 },
        { name: "iPhone 14 Plus", width: 414, height: 896 },
        { name: "iPhone 14", width: 390, height: 844 },
        { name: "iPhone SE 3", width: 375, height: 667 },
        { name: "iPhone 13 Pro Max", width: 428, height: 926 },
        { name: "iPhone 13 Pro", width: 390, height: 844 },
        { name: "iPhone 13", width: 390, height: 844 },
        { name: "iPhone 13 Mini", width: 375, height: 812 },
        { name: "iPhone 12 Pro Max", width: 428, height: 926 },
        { name: "iPhone 12 Pro", width: 390, height: 844 },
        { name: "iPhone 12", width: 390, height: 844 },
        { name: "iPhone 12 Mini", width: 375, height: 812 },
        { name: "iPhone SE 2", width: 375, height: 667 },
        { name: "iPhone 11 Pro Max", width: 414, height: 896 },
        { name: "iPhone 11 Pro", width: 375, height: 812 },
        { name: "iPhone 11", width: 414, height: 896 },
        { name: "iPhone Xs Max", width: 414, height: 896 },
        { name: "iPhone Xs", width: 375, height: 812 },
        { name: "iPhone Xr", width: 414, height: 896 },
        { name: "iPhone X", width: 375, height: 812 },
        { name: "iPhone 8 Plus", width: 414, height: 736 },
        { name: "iPhone 8", width: 375, height: 667 },
        { name: "iPhone 7 Plus", width: 414, height: 736 },
        { name: "iPhone 7", width: 375, height: 667 },
        { name: "iPhone SE 1", width: 320, height: 568 },
        { name: "iPhone 6s Plus", width: 414, height: 736 },
        { name: "iPhone 6s", width: 375, height: 667 },
        { name: "iPhone 6 Plus", width: 414, height: 736 },
        { name: "iPhone 6", width: 375, height: 667 },
        { name: "iPhone 5c", width: 320, height: 568 },
        { name: "iPhone 5s", width: 320, height: 568 },
        { name: "iPhone 5", width: 320, height: 568 },
        { name: "iPhone 4s", width: 320, height: 480 },
        { name: "iPhone 4", width: 320, height: 480 },
        { name: "iPhone 3Gs", width: 320, height: 480 },
        { name: "iPhone 3G", width: 320, height: 480 },
        { name: "iPhone 2G", width: 320, height: 480 },
    ];

    const normalizedMinDim = Math.round(minDim);
    const normalizedMaxDim = Math.round(maxDim);

    for (const model of iPhoneModels) {
        const modelMin = Math.min(model.width, model.height);
        const modelMax = Math.max(model.width, model.height);

        if (
            Math.abs(normalizedMinDim - modelMin) <= 5 &&
            Math.abs(normalizedMaxDim - modelMax) <= 5
        ) {
            return model.name;
        }
    }

    return "iPhone (Unknown Model)";
};

// Helper function để parse thông tin thiết bị chi tiết từ user agent
const getDetailedDeviceInfo = (userAgent) => {
    const ua = userAgent.toLowerCase();

    // Detect device type
    let deviceType = "💻 Desktop";
    if (ua.includes("iphone")) {
        deviceType = "📱 iPhone";
    } else if (ua.includes("ipad")) {
        deviceType = "📱 iPad";
    } else if (ua.includes("android") && ua.includes("mobile")) {
        deviceType = "📱 Android Phone";
    } else if (ua.includes("android")) {
        deviceType = "📱 Android Tablet";
    }

    // Detect OS version
    let osVersion = "";
    if (ua.includes("iphone") || ua.includes("ipad")) {
        const match = ua.match(/os (\d+)_(\d+)_?(\d*)/);
        osVersion = match ? `iOS ${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}` : "iOS";
    } else if (ua.includes("android")) {
        const match = ua.match(/android (\d+\.?\d*\.?\d*)/);
        osVersion = match ? `Android ${match[1]}` : "Android";
    } else if (ua.includes("windows")) {
        osVersion = "Windows";
    } else if (ua.includes("mac os x")) {
        const match = ua.match(/mac os x (\d+)_(\d+)_?(\d*)/);
        osVersion = match ? `macOS ${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}` : "macOS";
    }

    // Detect browser
    let browser = "Unknown";
    if (ua.includes("gsa/")) {
        browser = "Google App";
    } else if (ua.includes("crios")) {
        browser = "Chrome iOS";
    } else if (ua.includes("fxios")) {
        browser = "Firefox iOS";
    } else if (ua.includes("edg")) {
        browser = "Edge";
    } else if (ua.includes("chrome")) {
        browser = "Chrome";
    } else if (ua.includes("safari") && ua.includes("version")) {
        browser = "Safari";
    } else if (ua.includes("firefox")) {
        browser = "Firefox";
    }

    return { deviceType, osVersion, browser };
};

function AccessModal({ data, setIsShowModal }) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language && i18n.language.startsWith('en') ? 'en-US' : 'vi-VN';

    return (
        <div className="modal-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setIsShowModal(false)
                }
            }}
        >
            <div className="modal-box">

                <div className="modal-close" onClick={() => setIsShowModal(false)}>✕</div>

                {data.map(item => {
                    const deviceInfo = getDetailedDeviceInfo(item?.user_agent || "");
                    const width = parseInt(item?.width) || 0;
                    const height = parseInt(item?.height) || 0;

                    // Detect iPhone model
                    let iPhoneModel = "Unknown";
                    if (/iPhone/i.test(item?.user_agent) && width && height) {
                        iPhoneModel = detectiPhoneModel(width, height);
                    }

                    // Parse thông tin địa chỉ từ IP location
                    const ipLocation = parseIpLocation(item?.diachi_iplocation || "");

                    return (
                        <div className="log-item" key={item?.id}>
                            <p><strong>{t('usersAccess.modal.userInfo')}: {item?.browser_info}</strong></p>
                            <p><strong>{t('usersAccess.modal.ip')}:</strong> {item?.ip_location}</p>
                            <p><strong>{t('usersAccess.modal.device')}:</strong> <span style={{ color: '#3b82f6' }}>{deviceInfo.deviceType}</span></p>
                            <p><strong>{t('usersAccess.modal.os')}:</strong> <span style={{ color: '#10b981' }}>{deviceInfo.osVersion}</span></p>
                            <p><strong>{t('usersAccess.modal.browser')}:</strong> <span style={{ color: '#f59e0b' }}>{deviceInfo.browser}</span></p>
                            {iPhoneModel !== "Unknown" && <p><strong>{t('usersAccess.modal.iphoneModel')}: </strong> <span style={{ color: '#f59e0b' }}>{iPhoneModel}</span></p>}
                            <p><strong>{t('usersAccess.modal.isp')}:</strong> <span style={{ color: '#8b5cf6' }}>{ipLocation.isp}</span></p>
                            <p><strong>{t('usersAccess.modal.country')}:</strong> <span style={{ color: '#8b5cf6' }}>{ipLocation.country_name}</span></p>
                            <p><strong>{t('usersAccess.modal.region')}:</strong> <span style={{ color: '#8b5cf6' }}>{ipLocation.region_name}</span></p>
                            <p><strong>{t('usersAccess.modal.screenSize')}:</strong> {item?.width}x{item?.height}</p>
                            <p><strong>{t('usersAccess.modal.address')}:</strong> <span style={{ color: '#06EF06' }}>{item?.diachi_chi_tiet}</span></p>
                            <p><strong>{t('usersAccess.modal.screen')}:</strong> {item?.widget_activate}</p>
                            <p><strong>{t('usersAccess.modal.time')}:</strong> {new Date(item.time_access).toLocaleString(locale, {
                                weekday: "long",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                            })}</p>
                            <p><strong>{t('usersAccess.modal.userAgent')}:</strong> {item?.user_agent}</p>
                            <a href={item.linkmap} target="_blank" className="map-link">
                                {t('usersAccess.modal.viewOnGoogleMaps')}
                            </a>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default AccessModal;