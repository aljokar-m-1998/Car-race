let I18N = { t: (k)=>k, lang: 'ar' };

async function setLang(lang) {
  const res = await fetch(`/lang/${lang}.json`);
  const data = await res.json();
  I18N.lang = lang;
  I18N.t = (k) => data[k] || k;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  // حدث النصوص ذات data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = I18N.t(el.getAttribute('data-i18n'));
  });
  localStorage.setItem('lang', lang);
}
async function initLang() {
  await setLang(localStorage.getItem('lang') || 'ar');
}
