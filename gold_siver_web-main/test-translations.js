// Test script to verify translations are loaded
import i18n from "./src/config/i18n.js";

const checkTranslations = () => {
  console.log("=== Translation Keys Check ===");
  console.log("Current language:", i18n.language);

  // Check Vietnamese keys
  const viKeys = [
    "notificationHistory.history",
    "notificationHistory.allDays",
    "notificationHistory.empty",
    "notificationHistory.deleteConfirm",
  ];

  console.log("\n--- Vietnamese Translations ---");
  viKeys.forEach((key) => {
    const value = i18n.t(key);
    console.log(`${key}: ${value}`);
  });

  // Try to load translation for Italian
  console.log("\n--- Attempting to load Italian translations ---");
  i18n.changeLanguage("it").then(() => {
    console.log("Changed to Italian");
    viKeys.forEach((key) => {
      const value = i18n.t(key);
      console.log(`${key}: ${value}`);
    });
  });
};

checkTranslations();
