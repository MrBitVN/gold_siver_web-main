import React from "react";
import "./Footer.css";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>AI ANALYSIS</h3>
          <p className="company-tagline">
            {t("footer.tagline")}
          </p>
        </div>

        <div className="footer-section">
          <h4>{t("footer.contact")}</h4>
        </div>

        <div className="footer-section">
          <h4>{t("footer.disclaimerTitle")}</h4>
          <p className="disclaimer">
            {t("footer.disclaimer")}
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
};

export default Footer;