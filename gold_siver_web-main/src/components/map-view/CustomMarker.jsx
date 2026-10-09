import L from "leaflet";
import ReactDOM from "react-dom/client";
import { Marker } from "react-leaflet";
import { useEffect, useRef } from "react";

export default function CustomMarker({ position, children }) {
  const iconRef = useRef(null);
  const rootRef = useRef(null);
  const divId = useRef("marker-" + Math.random().toString(36).substring(2));

  // Tạo DivIcon: Chỉ chạy lần đầu
  if (!iconRef.current) {
    iconRef.current = L.divIcon({
      className: "custom-react-marker",
      html: `<div id="${divId.current}" style="
    transform: translate(-50%, -100%);
  "></div>`,
    });
  }

  // 1. Quản lý React Root Lifecycle (Mount/Unmount)
  useEffect(() => {
    const container = document.getElementById(divId.current);
    if (!container) return;
    rootRef.current = ReactDOM.createRoot(container);
    // Cleanup: Hủy root khi component unmount để tránh memory leak
    return () => {
      if (rootRef.current) {
        const root = rootRef.current;
        setTimeout(() => {
          root.unmount();        // ✔ unmount sau render → không lỗi
        }, 0);
        rootRef.current = null;
      }
    };
  }, []); // Chỉ chạy khi mount và unmount

  // 2. Render Nội dung (chạy khi children thay đổi)
  useEffect(() => {
    if (rootRef.current) {
      // console.log("children: ", children); // Có thể bỏ
      rootRef.current.render(children);
    }
  }, [children]); // Chạy mỗi khi children thay đổi

  // Marker component chính
  return <Marker position={position} icon={iconRef.current} />;
}