import React from "react";
import "./NotificationBell.css";

const LiveNewsBell = ({ onClick, hasNew }) => {
  return (
    <button
      className={`notification-bell ${hasNew ? "has-unread" : ""}`}
      onClick={onClick}
      title="Tin tức mới"
    >
      <span className="bell-icon">📰</span>
    </button>
  );
};

export default LiveNewsBell;
