import { useState, useEffect } from "react";

export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    //1. Nếu đã có tọa độ trong storage → load trước
    // const savedCoords = localStorage.getItem("user_coords");
    // if (savedCoords) {
    //   setCoords(JSON.parse(savedCoords)); // hàm setCoords do bạn tự tạo

    //   console.log("lấy tọa độ trong storege");
      
    //   return
    // }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        localStorage.setItem("user_coords", JSON.stringify({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }));

      },
      (err) => setError(err.message),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

  }, []);
  console.log("vị trí: ", coords);
  return { coords, error };
}
