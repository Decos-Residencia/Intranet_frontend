(function () {
  window.Services = window.Services || {};

  const PAGE_SIZE = 100; // limite máximo aceito pelo backend

  function toQuery(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") query.set(key, value);
    });
    const text = query.toString();
    return text ? `?${text}` : "";
  }

  // Percorre todas as páginas de uma listagem paginada ({items,total,page,page_size}).
  // Aceita também endpoints que devolvem a lista direta.
  async function listAll(listFn, params = {}) {
    const out = [];
    for (let page = 1; page <= 1000; page++) {
      const res = await listFn({ ...params, page, page_size: PAGE_SIZE });
      if (Array.isArray(res)) return res;
      const items = res?.items || [];
      out.push(...items);
      if (!items.length || out.length >= (res?.total ?? 0)) break;
    }
    return out;
  }

  Object.assign(window.Services, { toQuery, listAll, PAGE_SIZE });
})();
