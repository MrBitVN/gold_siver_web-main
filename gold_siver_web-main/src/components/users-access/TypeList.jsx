import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './TypeList.css'
import AccessModal from './AccessModal';

// Helper function để parse thông tin thiết bị từ user agent
const getDeviceInfo = (userAgent) => {
    const ua = userAgent.toLowerCase();

    let text = "💻 Desktop";
    let color = "#3b82f6";

    // iOS App
    if (ua.includes("gold_silver")) {
        text = "📱 Mobile App - iOS";
        color = "red";
    }

    // Web iOS
    else if (ua.includes("iphone")) {
        const match = ua.match(/os (\d+)_(\d+)/);
        const version = match ? `${match[1]}.${match[2]}` : "";
        text = `📱 Web iOS${version ? " " + version : ""}`;
        color = "red";
    }

    // Android Web (Chrome / Safari)
    else if (ua.includes("android") && (ua.includes("chrome") || ua.includes("safari"))) {
        const match = ua.match(/android (\d+\.?\d*)/);
        const version = match ? match[1] : "";
        text = `📱 Web Android${version ? " " + version : ""}`;
        color = "#facc15";
    }

    // Android Mobile (không phải web browser)
    else if (ua.includes("android")) {
        const match = ua.match(/android (\d+\.?\d*)/);
        const version = match ? match[1] : "";
        text = `📱 Mobile App - Android${version ? " " + version : ""}`;
        color = "#facc15";
    }

    // Windows Desktop
    else if (ua.includes("windows")) {
        text = "💻 Desktop - Windows";
    }

    return { text, color };
};

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
// Function để detect iPhone model từ screen size
const detectiPhoneModel = (width, height) => {
    const [minDim, maxDim] = [Math.min(width, height), Math.max(width, height)];

    const iPhoneModels = [
        // iPhone 17 series
        { name: "iPhone 17", width: 393, height: 852 },
        { name: "iPhone Air", width: 414, height: 896 },
        { name: "iPhone 17 Pro", width: 393, height: 852 },
        { name: "iPhone 17 Pro Max", width: 430, height: 932 },

        // iPhone 16 series
        { name: "iPhone 16 Pro Max", width: 430, height: 932 },
        { name: "iPhone 16 Pro", width: 393, height: 852 },
        { name: "iPhone 16 Plus", width: 414, height: 896 },
        { name: "iPhone 16", width: 393, height: 852 },

        // iPhone 15 series
        { name: "iPhone 15 Pro Max", width: 430, height: 932 },
        { name: "iPhone 15 Pro", width: 393, height: 852 },
        { name: "iPhone 15 Plus", width: 414, height: 896 },
        { name: "iPhone 15", width: 393, height: 852 },

        // iPhone 14 series
        { name: "iPhone 14 Pro Max", width: 430, height: 932 },
        { name: "iPhone 14 Pro", width: 393, height: 852 },
        { name: "iPhone 14 Plus", width: 414, height: 896 },
        { name: "iPhone 14", width: 390, height: 844 },

        // iPhone SE 3
        { name: "iPhone SE 3", width: 375, height: 667 },

        // iPhone 13 series
        { name: "iPhone 13 Pro Max", width: 428, height: 926 },
        { name: "iPhone 13 Pro", width: 390, height: 844 },
        { name: "iPhone 13", width: 390, height: 844 },
        { name: "iPhone 13 Mini", width: 375, height: 812 },

        // iPhone 12 series
        { name: "iPhone 12 Pro Max", width: 428, height: 926 },
        { name: "iPhone 12 Pro", width: 390, height: 844 },
        { name: "iPhone 12", width: 390, height: 844 },
        { name: "iPhone 12 Mini", width: 375, height: 812 },

        // iPhone SE 2
        { name: "iPhone SE 2", width: 375, height: 667 },

        // iPhone 11 series
        { name: "iPhone 11 Pro Max", width: 414, height: 896 },
        { name: "iPhone 11 Pro", width: 375, height: 812 },
        { name: "iPhone 11", width: 414, height: 896 },

        // iPhone XS series
        { name: "iPhone Xs Max", width: 414, height: 896 },
        { name: "iPhone Xs", width: 375, height: 812 },
        { name: "iPhone Xr", width: 414, height: 896 },
        { name: "iPhone X", width: 375, height: 812 },

        // iPhone 8 series
        { name: "iPhone 8 Plus", width: 414, height: 736 },
        { name: "iPhone 8", width: 375, height: 667 },

        // iPhone 7 series
        { name: "iPhone 7 Plus", width: 414, height: 736 },
        { name: "iPhone 7", width: 375, height: 667 },

        // iPhone SE 1
        { name: "iPhone SE 1", width: 320, height: 568 },

        // iPhone 6s series
        { name: "iPhone 6s Plus", width: 414, height: 736 },
        { name: "iPhone 6s", width: 375, height: 667 },

        // iPhone 6 series
        { name: "iPhone 6 Plus", width: 414, height: 736 },
        { name: "iPhone 6", width: 375, height: 667 },

        // iPhone 5c
        { name: "iPhone 5c", width: 320, height: 568 },

        // iPhone 5s/5
        { name: "iPhone 5s", width: 320, height: 568 },
        { name: "iPhone 5", width: 320, height: 568 },

        // iPhone 4s/4
        { name: "iPhone 4s", width: 320, height: 480 },
        { name: "iPhone 4", width: 320, height: 480 },

        // iPhone 3Gs/3G/2G
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

function TypeList({ data }) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language && i18n.language.startsWith('en') ? 'en-US' : 'vi-VN';

    const [isShowModal, setIsShowModal] = useState(false)
    const [dataDetail, setDataDetail] = useState(null)

    return (
        <>
            <div className="log-container">
                {data && data.map((item, index) => {
                    const ip = item?.ten.split("___")[0]
                    const userAgent = item?.danhsach[0]?.user_agent || "";
                    const width = parseInt(item?.danhsach[0]?.width) || 0;
                    const height = parseInt(item?.danhsach[0]?.height) || 0;

                    // Detect iPhone model từ width/height
                    let iPhoneModel = "Unknown";
                    if (/iPhone/i.test(userAgent) && width && height) {
                        iPhoneModel = detectiPhoneModel(width, height);
                    }

                    // Parse thông tin địa chỉ từ IP location
                    const ipLocation = parseIpLocation(item?.danhsach[0]?.diachi_iplocation || "");
                    const device = getDeviceInfo(userAgent, width, height);


                    return (
                        <div className="log-box" key={`${ip}-${index}`}
                            onClick={() => {
                                setIsShowModal(true)
                                setDataDetail(item?.danhsach)
                            }}>
                            <p><strong>{t('usersAccess.list.userInfo')}: <span>{item?.danhsach[0]?.browser_info}</span></strong></p>
                            <p><strong>{t('usersAccess.list.ip')}:</strong> {ip}</p>
                            <p><strong>{t('usersAccess.list.address')}:</strong> <span style={{ color: '#06EF06' }}>{item?.diachi}</span></p>
                            <p><strong>{t('usersAccess.list.isp')}:</strong> <span style={{ color: '#8b5cf6' }}>{ipLocation.isp}</span></p>
                            <p><strong>{t('usersAccess.list.country')}:</strong> <span style={{ color: '#8b5cf6' }}>{ipLocation.country_name}</span></p>
                            <p><strong>{t('usersAccess.list.region')}:</strong> <span style={{ color: '#8b5cf6' }}>{ipLocation.region_name}</span></p>
                            <p><strong>{t('usersAccess.list.device')}:</strong> <span style={{ color: device.color }}>{device.text}</span></p>
                            {iPhoneModel !== "Unknown" && <p><strong>{t('usersAccess.list.iphoneModel')}:</strong> <span style={{ color: '#f59e0b' }}>{iPhoneModel}</span></p>}
                            <p><strong>{t('usersAccess.list.lastAccess')}:</strong> {new Date(item?.danhsach[0].time_access).toLocaleString(locale, {
                                weekday: "long",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                            })}</p>
                            <p><strong>{t('usersAccess.list.visitCount')}:</strong> {item?.solan}</p>
                            <p><strong>{t('usersAccess.list.screenSize')}:</strong> {item?.danhsach[0].width}x{item?.danhsach[0].height}</p>
                        </div>
                    );
                })}
                {data && data.length === 0 &&
                    <h3 style={{ marginTop: '30px' }}>{t('usersAccess.noData')}</h3>
                }
            </div>
            {isShowModal && <AccessModal data={dataDetail} setIsShowModal={setIsShowModal} />}
        </>
    );
}

export default TypeList;