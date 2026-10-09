import React from "react";
import "./ImportanceStars.css";

/**
 * Component hiển thị mức độ quan trọng (sao)
 * @param {number} level - Mức độ từ 0-3
 */
const ImportanceStars = ({ level = 0 }) => {
  const stars = [];
  
  for (let i = 0; i < 3; i++) {
    stars.push(
      <span key={i} className={`star ${i < level ? "filled" : ""}`}>
        ★
      </span>
    );
  }
  
  return <div className="importance-stars">{stars}</div>;
};

export default ImportanceStars;

