import React from "react";
import "./StoreNearby.css";
export default function StoreNearby({ dataMaps, location }) {
    console.log("location: ", location);


    if (!location) {
        return (
            <div className="p-3 text-gray-500">
                Vui lòng cho phép truy cập vị trí để xem cửa hàng gần bạn.
            </div>
        );
    }
    console.log("datamapp: ", dataMaps);

    const stores = filterStoresWithinRadius(dataMaps, location.latitude, location.longitude, 50)
    if (!stores.length) {
        return (
            <div className="p-3 text-gray-500">
                Không tìm thấy cửa hàng nào trong khu vực của bạn.
            </div>
        );
    }

    return (
        <div className="store-list-container">
            <h3 className="store-title">📍 Danh sách cửa hàng gần bạn</h3>

            <select
                className="store-select"
                onChange={(e) => {
                    const index = e.target.value;
                    if (index !== "") {
                        onSelectStore(stores[index]);
                    }
                }}
            >

                {stores.map((store, index) => (
                    <option key={index} value={index}>
                        {store.name}
                        {store.distance !== undefined
                            ? ` — ${store.distance.toFixed(1)} km`
                            : ""}
                    </option>
                ))}
            </select>

            {/* CSS */}
        </div>
    );
}

function distanceInKm(lat1, lon1, lat2, lon2) {
    console.log("lat1: ", lat1, lon1, lat2, lon2);

    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}
function filterStoresWithinRadius(stores, userLat, userLong, radiusKm = 50) {
    return stores
        .map(store => {
            if (store.lat == null || store.long == null) return null;

            const dist = distanceInKm(userLat, userLong, store.lat, store.long);
            console.log("dist: ", dist);
            return {
                ...store,
                distance: dist
            };
        })
        .filter(store => store && store.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance); // gần → xa
}
