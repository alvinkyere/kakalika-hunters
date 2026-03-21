const https = require("https");

const DEEPL_API_URL = "api-free.deepl.com"; // swap to "api.deepl.com" for paid tier

// Cache: key = `${text}__${targetLang}`, value = translated string
const translationCache = new Map();
const MAX_CACHE_SIZE = 500;

function buildRequestBody(text, targetLang) {
  return JSON.stringify({
    text: [text],
    target_lang: targetLang.toUpperCase(),
  });
}

function httpPost(body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: DEEPL_API_URL,
      path: "/v2/translate",
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Failed to parse DeepL response"));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function translate(text, targetLang) {
  if (!text || !targetLang) return text;

  const cacheKey = `${text}__${targetLang.toUpperCase()}`;

  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const body = buildRequestBody(text, targetLang);
    const response = await httpPost(body);
    const translated = response.translations?.[0]?.text ?? text;

    // Evict oldest entry if cache is full
    if (translationCache.size >= MAX_CACHE_SIZE) {
      const firstKey = translationCache.keys().next().value;
      translationCache.delete(firstKey);
    }

    translationCache.set(cacheKey, translated);
    return translated;
  } catch (err) {
    console.error("[DeepL] Translation error:", err.message);
    return text; // Fall back to original text on failure
  }
}

function clearCache() {
  translationCache.clear();
}

module.exports = { translate, clearCache };
