import React, { useState, useRef, useEffect } from "react";
import "./TimeSlider.css";

export default function TimeSlider({ times = [] }) {
    const sliderRef = useRef(null);
    const [position, setPosition] = useState(0);

    // Tổng số điểm (ví dụ: 12 mốc giờ)
    const total = times.length;

    const handleMouseDown = () => {
        window.addEventListener("mousemove", handleDrag);
        window.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleDrag);
        window.removeEventListener("mouseup", handleMouseUp);
    };

    const handleDrag = (e) => {
        const rect = sliderRef.current.getBoundingClientRect();
        let x = e.clientX - rect.left;

        x = Math.max(0, Math.min(x, rect.width));
        setPosition(x);
    };

    // Tự động snap tới mốc gần nhất (optional – bật/tắt nếu muốn)
    const snapToNearest = () => {
        const trackWidth = sliderRef.current.getBoundingClientRect().width;
        const step = trackWidth / (total - 1);

        const nearest = Math.round(position / step) * step;
        setPosition(nearest);
    };

    useEffect(() => {
        window.addEventListener("mouseup", snapToNearest);
        return () => window.removeEventListener("mouseup", snapToNearest);
    });

    return (
        <div className="time-slider-container">

            {/* Track */}
            <div className="slider-track" ref={sliderRef}>
                <div className="slider-highlight" style={{ width: position }} />

                <div
                    className="slider-handle"
                    style={{ left: position }}
                    onMouseDown={handleMouseDown}
                />
            </div>

            {/* Time Labels */}
            <div className="time-labels">
                {times.map((t, idx) => (
                    <div key={idx} className="time-label">
                        {t}
                    </div>
                ))}
            </div>

        </div>
    );
}
