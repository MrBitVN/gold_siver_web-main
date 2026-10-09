import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useTranslation } from "react-i18next";
import "./TypeMap.css"
import _ from 'lodash'

const icon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [32, 32]
});

// Helper function để parse thông tin thiết bị từ user agent
const getDeviceInfo = (userAgent) => {
    const ua = userAgent.toLowerCase();
    
    // Detect device type
    let deviceType = "💻 Desktop";
    if (ua.includes("iphone") || ua.includes("android") && ua.includes("mobile")) {
        deviceType = "📱 Mobile";
    } else if (ua.includes("ipad") || ua.includes("tablet")) {
        deviceType = "📱 Tablet";
    }
    
    // Detect OS
    let os = "Unknown";
    if (ua.includes("iphone") || ua.includes("ipad")) {
        const match = ua.match(/os (\d+)_(\d+)/);
        os = match ? `iOS ${match[1]}.${match[2]}` : "iOS";
    } else if (ua.includes("android")) {
        const match = ua.match(/android (\d+\.?\d*)/);
        os = match ? `Android ${match[1]}` : "Android";
    } else if (ua.includes("windows")) {
        os = "Windows";
    } else if (ua.includes("mac os x")) {
        os = "macOS";
    } else if (ua.includes("linux")) {
        os = "Linux";
    }
    
    return `${deviceType} - ${os}`;
};

function TypeMap({ data }) {
    const { t } = useTranslation();

    const dataMap = data.map(item => {
        return item?.danhsach[0]
    })

    return (
        <div style={{ padding: '20px' }}>
            <MapContainer
                center={[21.03, 105.85]} // Hà Nội
                zoom={11}
                style={{ height: "500px", width: "100%", borderRadius: "12px" }}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {dataMap && dataMap.map(item => {
                    const position = JSON.parse(item.maps);
                    return (
                        <Marker
                            key={item.id}
                            position={[position.lat, position.long]}
                            icon={icon}
                        >
                            <Popup>
                                <p><strong>{t('usersAccess.popup.ip')}:</strong> {item.ip_location}</p>
                                <p><strong>{t('usersAccess.popup.device')}:</strong> {getDeviceInfo(item?.user_agent)}</p>
                                <p><strong>{t('usersAccess.popup.address')}:</strong> {item?.diachi_chi_tiet}</p>
                                <a href={item.linkmap} target="_blank" className="map-link">
                                    {t('usersAccess.popup.viewOnGoogleMaps')}
                                </a>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}

export default TypeMap;