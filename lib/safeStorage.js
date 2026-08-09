// lib/safeStorage.js
//
// 🔥 NOVO: wrapper seguro para localStorage. O Safari (especialmente no
// modo privado, ou com "Prevent Cross-Site Tracking" em certas
// combinações) pode restringir o acesso a localStorage e lançar exceções
// tanto em getItem() quanto (mais comumente) em setItem(). Como nenhum
// dos acessos diretos a localStorage no app estava protegido com
// try/catch, um erro desses durante a renderização podia derrubar a
// árvore inteira do React silenciosamente - exatamente o sintoma de
// "tela em branco / só o fundo aparece" relatado no iPad.
//
// Estas funções NUNCA lançam - em caso de falha, apenas retornam um
// valor padrão seguro (ou não fazem nada), preservando o funcionamento
// do resto do app mesmo quando o armazenamento local está bloqueado.

export function safeGetItem(key, fallback = null) {
  try {
    if (typeof window === "undefined") return fallback;
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (e) {
    console.warn(`⚠️ localStorage.getItem("${key}") bloqueado:`, e?.message);
    return fallback;
  }
}

export function safeSetItem(key, value) {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`⚠️ localStorage.setItem("${key}") bloqueado:`, e?.message);
    return false;
  }
}

export function safeRemoveItem(key) {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn(`⚠️ localStorage.removeItem("${key}") bloqueado:`, e?.message);
    return false;
  }
}
