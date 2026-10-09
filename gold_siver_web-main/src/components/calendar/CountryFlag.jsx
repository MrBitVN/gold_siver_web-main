import React from "react";
import "./CountryFlag.css";

/**
 * Component hiển thị cờ quốc gia
 * @param {string} country - Mã quốc gia (US, GB, EU, JP...)
 */
const CountryFlag = ({ country = "US" }) => {
  // Map country code to emoji flag
  const getFlag = (code) => {
    const flagMap = {
      US: "🇺🇸",
      GB: "🇬🇧",
      EU: "🇪🇺",
      JP: "🇯🇵",
      CN: "🇨🇳",
      AU: "🇦🇺",
      CA: "🇨🇦",
      CH: "🇨🇭",
      NZ: "🇳🇿",
      VN: "🇻🇳",
    };
    
    return flagMap[code.toUpperCase()] || "🌐";
  };
  
  return (
    <div className="country-flag">
      <span className="flag-emoji">{getFlag(country)}</span>
    </div>
  );
};

export default CountryFlag;

