/* 三语国际化核心：合并语言包、切换语言、静态翻译 */
const I18N = (() => {
  const LANG_KEY = 'cryptoIntelLang';
  const DICT = {
    zh: window.__LANG_zh || {},
    en: window.__LANG_en || {},
    es: window.__LANG_es || {}
  };

  let lang = 'zh';
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && DICT[saved]) lang = saved;
  } catch (e) { /* ignore */ }

  function t(key, vars) {
    let s = (DICT[lang] && DICT[lang][key] != null) ? DICT[lang][key] : (DICT.en && DICT.en[key] != null) ? DICT.en[key] : key;
    if (Array.isArray(s)) s = s.join(' | ');
    if (vars) {
      Object.keys(vars).forEach(k => {
        s = String(s).split('{' + k + '}').join(String(vars[k]));
      });
    }
    return s;
  }

  function get() { return lang; }

  function set(next) {
    if (!DICT[next]) return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, next); } catch (e) { /* ignore */ }
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : next;
    translateStatic();
    document.dispatchEvent(new CustomEvent('langchange'));
  }

  function translateStatic() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    const pageName = t('app.name');
    if (pageName !== 'app.name') document.title = 'CryptoIntel · ' + pageName;
    const desc = t('meta.desc');
    if (desc !== 'meta.desc') {
      document.querySelector('meta[name="description"]').setAttribute('content', desc);
      document.querySelector('meta[property="og:description"]').setAttribute('content', desc);
    }
  }

  return { t, get, set, DICT, translateStatic };
})();
