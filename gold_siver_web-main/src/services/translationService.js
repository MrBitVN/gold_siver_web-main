import i18n from "i18next";

const languageChangeInFlight = new Map();
const backgroundTranslationInFlight = new Map();
const translationTextCache = new Map();
const MAX_CONCURRENT_TRANSLATIONS = 8;
const TRANSLATION_CACHE_VERSION = "v9";
const getResourceCacheKey = (lang) =>
  `i18n_resource_${TRANSLATION_CACHE_VERSION}_${lang}`;

const safeLocalStorageGet = (key) => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn("localStorage unavailable:", error);
    return null;
  }
};

const safeLocalStorageSet = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("localStorage unavailable:", error);
  }
};

export const TRANSLATION_BACKGROUND_STATUS_EVENT =
  "translation:background-status";

const emitBackgroundTranslationStatus = () => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(TRANSLATION_BACKGROUND_STATUS_EVENT, {
      detail: {
        isTranslating: backgroundTranslationInFlight.size > 0,
        activeTasks: backgroundTranslationInFlight.size,
      },
    }),
  );
};

/**
 * Dịch text qua Google Translate API (với CORS bypass)
 */
export const translateText = async (text, targetLang) => {
  if (!text || text.trim() === "") return text;
  const cacheKey = `${targetLang}::${text}`;
  if (translationTextCache.has(cacheKey)) {
    console.log(`💾 Cache hit for ${targetLang}`);
    return translationTextCache.get(cacheKey);
  }

  try {
    // Try Google Translate endpoint
    const googleEndpoint = (q) => `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(q)}`;

    console.log(`🌐 Translating (${text.length} chars) to ${targetLang}...`);
    let translatedText = "";

    // Helper to translate a chunk
    const translateChunk = async (chunk) => {
      try {
        const response = await fetch(googleEndpoint(chunk));
        if (response.ok) {
          const data = await response.json();
          const result = data?.[0]?.map(s => s?.[0] || "").join("");
          if (result && result !== chunk) return result;
        }
      } catch (e) {
        console.warn("  Google Chunk failed:", e.message);
      }

      return null; // Trả về null để biết là chưa dịch được
    };

    if (text.length < 1500) {
      translatedText = await translateChunk(text);
    } else {
      const chunks = [];
      for (let i = 0; i < text.length; i += 1500) {
        chunks.push(text.substring(i, i + 1500));
      }
      const results = await Promise.all(chunks.map(async (chunk) => {
        const result = await translateChunk(chunk);
        return result ?? chunk;
      }));
      translatedText = results.join("");
    }

    // If translation fails, preserve original text
    if (!translatedText) {
      console.warn("  Translation failed for text chunk; returning original text.");
    }

    if (translatedText) {
      translationTextCache.set(cacheKey, translatedText);
      return translatedText;
    }

    // Nếu không dịch được, trả về text gốc
    return text;
  } catch (error) {
    console.error("❌ Translation error:", error);
    translationTextCache.set(cacheKey, text);
    return text;
  }
};

/**
 * Dịch toàn bộ resource object từ Việt sang ngôn ngữ khác
 */
const mapWithConcurrency = async (items, concurrency, worker) => {
  const results = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({
    length: Math.min(concurrency, items.length),
  }).map(async () => {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
};

export const translateResourceRecursive = async (obj, targetLang) => {
  const translated = Array.isArray(obj) ? [] : {};
  const entries = Object.entries(obj || {});

  const translatedEntries = await mapWithConcurrency(
    entries,
    MAX_CONCURRENT_TRANSLATIONS,
    async ([key, value]) => {
      if (typeof value === "string") {
        return [key, await translateText(value, targetLang)];
      }

      if (value && typeof value === "object") {
        return [key, await translateResourceRecursive(value, targetLang)];
      }

      return [key, value];
    },
  );

  translatedEntries.forEach(([key, value]) => {
    translated[key] = value;
  });

  return translated;
};

const waitForI18nInitialized = async (maxAttempts = 30) => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (i18n.isInitialized) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return i18n.isInitialized;
};

/**
 * Dịch resource chính từ Việt sang ngôn ngữ đích
 */
export const getTranslatedResources = async (originalResources, targetLang) => {
  if (targetLang === "vi" || !targetLang) {
    return originalResources.vi?.translation || {};
  }

  // Kiểm tra cache trong localStorage
  const cacheKey = getResourceCacheKey(targetLang);
  const cached = safeLocalStorageGet(cacheKey);
  if (cached) {
    try {
      console.log(`✓ Loaded ${targetLang} from cache`);
      return JSON.parse(cached);
    } catch (e) {
      console.warn("Lỗi parse cache:", e);
    }
  }

  // Dịch resource từ Việt
  console.log(`🌐 Translating to ${targetLang}...`);
  const viResource = originalResources.vi?.translation;

  if (!viResource) {
    console.error("Vietnamese resource not found!");
    return {};
  }

  const translatedResource = await translateResourceRecursive(
    viResource,
    targetLang,
  );

  // Lưu cache
  safeLocalStorageSet(cacheKey, JSON.stringify(translatedResource));
  console.log(`✓ Translation to ${targetLang} completed and cached`);

  return translatedResource;
};

const applyLanguageBundle = async (lang, bundle) => {
  if (bundle && typeof bundle === "object" && Object.keys(bundle).length > 0) {
    i18n.addResourceBundle(lang, "translation", bundle, true, true);
  }

  await i18n.changeLanguage(lang);
  safeLocalStorageSet("lang", lang);

  // Emit event để notify components khi language onChange
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("language-changed", { detail: { lang } }),
    );
  }
};

const ensureBackgroundTranslation = (lang, originalResources) => {
  if (lang === "vi") return;

  const taskKey = `bg_${lang}`;
  if (backgroundTranslationInFlight.has(taskKey)) return;

  const task = (async () => {
    try {
      const translatedResource = await getTranslatedResources(
        originalResources,
        lang,
      );
      if (translatedResource && Object.keys(translatedResource).length > 0) {
        i18n.addResourceBundle(
          lang,
          "translation",
          translatedResource,
          true,
          true,
        );
      }
    } catch (error) {
      console.warn(`Background translation failed for ${lang}:`, error);
    } finally {
      backgroundTranslationInFlight.delete(taskKey);
      emitBackgroundTranslationStatus();
    }
  })();

  backgroundTranslationInFlight.set(taskKey, task);
  emitBackgroundTranslationStatus();
};

/**
 * Thay đổi ngôn ngữ và tự động dịch resource
 */
export const changeLanguageWithTranslation = async (
  lang,
  originalResources,
) => {
  const requestKey = `lang_change_${lang}`;
  if (languageChangeInFlight.has(requestKey)) {
    return languageChangeInFlight.get(requestKey);
  }

  const requestPromise = (async () => {
    try {
      console.log(`🌐 Starting translation to ${lang}...`);
      await waitForI18nInitialized();

      if (lang === "vi") {
        await applyLanguageBundle(
          lang,
          originalResources.vi?.translation || {},
        );
        return true;
      }

      // Nếu là tiếng Anh, ưu tiên dùng resource có sẵn trong code
      if (lang === "en" && originalResources.en?.translation) {
        await applyLanguageBundle(
          lang,
          originalResources.en.translation,
        );
        return true;
      }

      const existingBundle = i18n.getResourceBundle(lang, "translation");
      if (existingBundle && Object.keys(existingBundle).length > 0) {
        await applyLanguageBundle(lang, existingBundle);
        return true;
      }

      const cachedResource = safeLocalStorageGet(getResourceCacheKey(lang));
      if (cachedResource) {
        try {
          const parsedCachedResource = JSON.parse(cachedResource);
          await applyLanguageBundle(lang, parsedCachedResource);
          return true;
        } catch (error) {
          console.warn("Invalid cached translation resource:", error);
        }
      }

      // Chuyển ngôn ngữ ngay với fallback tiếng Việt để tránh giật/đơ UI.
      const fallbackResource = originalResources.vi?.translation || {};
      await applyLanguageBundle(lang, fallbackResource);

      // Dịch đầy đủ chạy nền và tự cập nhật khi xong.
      ensureBackgroundTranslation(lang, originalResources);
      return true;
    } catch (error) {
      console.error("❌ Lỗi khi thay đổi ngôn ngữ:", error);
      alert(`Lỗi dịch sang ${lang}. Vui lòng thử lại!`);
      return false;
    } finally {
      languageChangeInFlight.delete(requestKey);
    }
  })();

  languageChangeInFlight.set(requestKey, requestPromise);
  return requestPromise;
};
