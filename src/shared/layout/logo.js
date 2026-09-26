/* =========================================================================
   Logo
   ========================================================================= */
(function () {
  function logo() {
    return `<div class="flex items-center gap-2.5">
      <img src="assets/img/logo.png" alt="Hospital Decós" class="h-7 w-auto logo-img logo-full shrink-0">
      <img src="assets/img/simbolo.png" alt="Hospital Decós" class="h-8 w-8 logo-img logo-mark shrink-0">
      <span class="sb-label ml-1 pl-3 text-sm sb-muted" style="border-left:1px solid var(--border)">Intranet</span>
    </div>`;
  }

  Object.assign(UI, { logo });
})();
