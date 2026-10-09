import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, getLanguageFlagMeta } from "../../config/languages";
import "./LanguageSelector.css";

const LanguageSelector = ({
  isOpen,
  onClose,
  onSelectLanguage,
  currentLanguage,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedCurrentLanguage = (currentLanguage || "").toLowerCase();

  const filteredLanguages = useMemo(() => {
    return SUPPORTED_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="language-selector-overlay" onClick={onClose}>
      <div
        className="language-selector-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="language-selector-header">
          <h2>{t('languageSelector.title', 'Chọn ngôn ngữ')}</h2>
          <button className="language-selector-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <input
          type="text"
          className="language-selector-search"
          placeholder={t('languageSelector.searchPlaceholder', 'Tìm kiếm ngôn ngữ')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />

        <div className="language-selector-list">
          {filteredLanguages.map((lang) => {
            const flagMeta = getLanguageFlagMeta(lang);
            return (
              <button
                key={lang.code}
                className={`language-item ${
                  normalizedCurrentLanguage === lang.code.toLowerCase()
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  onClose();
                  onSelectLanguage(lang.code);
                }}
              >
                {flagMeta.type === "image" ? (
                  <img
                    src={flagMeta.value}
                    alt={flagMeta.alt}
                    className="language-flag-image"
                    loading="lazy"
                  />
                ) : (
                  <span className="language-flag" role="img" aria-label={lang.name}>
                    {flagMeta.value}
                  </span>
                )}
                <span className="language-name">{lang.name}</span>
                {normalizedCurrentLanguage === lang.code.toLowerCase() && (
                  <span className="language-checkmark">✓</span>
                )}
              </button>
            );
          })}
        </div>
        {filteredLanguages.length === 0 && (
          <div className="language-selector-empty">{t('languageSelector.noResults', 'Không tìm thấy ngôn ngữ nào')}</div>
        )}
      </div>
    </div>
  );
};

export default LanguageSelector;
