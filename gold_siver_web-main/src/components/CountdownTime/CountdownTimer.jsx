import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ updateTime }) => {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!updateTime) return;

        const parseDateString = (str) => {
            const [timePart, datePart] = str.split(' ');
            const [hours, minutes, seconds] = timePart.split(':').map(Number);
            const [day, month, year] = datePart.split('/').map(Number);
            
            // Lưu ý: month trong Date của JS bắt đầu từ 0 (0 = Tháng 1)
            return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
        };

        const baseTime = parseDateString(updateTime);
        const targetTime = baseTime + (4 * 60 * 60 * 1000);

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const difference = targetTime - now;

            if (difference > 0) {
                setTimeLeft(Math.floor(difference / 1000));
            } else {
                setTimeLeft(0);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [updateTime]);

    const formatTime = (totalSeconds) => {
        if (totalSeconds === null) return "--:--:--";
        if (totalSeconds <= 0) return "00:00:00";

        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        
        return `${h}:${m}:${s}`;
    };

    return (
        <span className="" style={{fontFamily: "monospace", marginLeft: "8px" }}>
            {formatTime(timeLeft)}
        </span>
    );
};

export default CountdownTimer;