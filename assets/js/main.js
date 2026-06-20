/* ليجند شوكولا — main.js (vanilla, guarded) */
(function () {
  "use strict";

  /* ---------- Mobile menu (full-screen) ---------- */
  var burger = document.querySelector("[data-burger]");
  var menu = document.querySelector("[data-mobile-menu]");
  var closeBtn = document.querySelector("[data-menu-close]");

  function setMenu(open) {
    if (!menu) return;
    menu.setAttribute("data-open", open ? "true" : "false");
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
    if (open && closeBtn) closeBtn.focus();
    else if (!open && burger) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setMenu(true); });
  if (closeBtn) closeBtn.addEventListener("click", function () { setMenu(false); });
  if (menu) {
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (menu && menu.getAttribute("data-open") === "true") setMenu(false);
      closeLightbox();
    }
  });

  /* ---------- Scroll reveal (IntersectionObserver + fallback) ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  function showAll() { revealEls.forEach(function (el) { el.classList.add("is-visible"); }); }

  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = parseInt(el.getAttribute("data-delay") || "0", 10);
          setTimeout(function () { el.classList.add("is-visible"); }, delay);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
    /* Safety fallback: ensure nothing stays hidden */
    setTimeout(showAll, 2500);
  } else {
    showAll();
  }

  /* ---------- Lightbox-lite ---------- */
  var lightbox = document.querySelector("[data-lightbox]");
  var lightboxImg = lightbox ? lightbox.querySelector("img") : null;
  var lightboxClose = lightbox ? lightbox.querySelector("[data-lightbox-close]") : null;

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    lightbox.setAttribute("data-open", "true");
    document.body.style.overflow = "hidden";
    if (lightboxClose) lightboxClose.focus();
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.setAttribute("data-open", "false");
    document.body.style.overflow = "";
  }
  document.querySelectorAll("[data-gallery-item]").forEach(function (item) {
    var img = item.querySelector("img");
    if (!img) return;
    item.addEventListener("click", function () { openLightbox(img.src, img.alt); });
    item.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(img.src, img.alt); }
    });
  });
  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightbox) lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  /* ---------- Order form → wa.me + localStorage + toast ---------- */
  var form = document.querySelector("[data-order-form]");
  var toast = document.querySelector("[data-toast]");
  var WA = "966548441408";

  function showToast() {
    if (!toast) return;
    toast.setAttribute("data-show", "true");
    setTimeout(function () { toast.setAttribute("data-show", "false"); }, 5000);
  }

  function validate(field) {
    var input = field.querySelector("input, select, textarea");
    if (!input) return true;
    var ok = true;
    if (input.hasAttribute("required") && !input.value.trim()) ok = false;
    if (input.type === "tel" && input.value.trim()) {
      ok = /[0-9]{8,}/.test(input.value.replace(/[\s-]/g, ""));
    }
    field.setAttribute("data-invalid", ok ? "false" : "true");
    return ok;
  }

  if (form) {
    form.querySelectorAll(".field").forEach(function (field) {
      var input = field.querySelector("input, select, textarea");
      if (input) input.addEventListener("blur", function () { validate(field); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fields = form.querySelectorAll(".field");
      var allOk = true;
      fields.forEach(function (field) { if (!validate(field)) allOk = false; });
      if (!allOk) {
        var firstBad = form.querySelector('.field[data-invalid="true"] input, .field[data-invalid="true"] select, .field[data-invalid="true"] textarea');
        if (firstBad) firstBad.focus();
        return;
      }

      var data = {
        name: (form.elements["name"] || {}).value || "",
        phone: (form.elements["phone"] || {}).value || "",
        item: (form.elements["item"] || {}).value || "",
        date: (form.elements["date"] || {}).value || "",
        notes: (form.elements["notes"] || {}).value || ""
      };

      /* localStorage demo */
      try {
        var store = JSON.parse(localStorage.getItem("legend_orders") || "[]");
        store.push(Object.assign({ ts: new Date().toISOString() }, data));
        localStorage.setItem("legend_orders", JSON.stringify(store));
      } catch (err) { /* ignore */ }

      /* Build WhatsApp message */
      var lines = [
        "السلام عليكم، أبغى أطلب من ليجند شوكولا:",
        "الاسم: " + data.name,
        "الجوال: " + data.phone,
        "الطلب: " + data.item
      ];
      if (data.date) lines.push("التاريخ المطلوب: " + data.date);
      if (data.notes) lines.push("ملاحظات: " + data.notes);
      var url = "https://wa.me/" + WA + "?text=" + encodeURIComponent(lines.join("\n"));

      showToast();
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; setTimeout(function () { btn.disabled = false; }, 1600); }
      setTimeout(function () { window.open(url, "_blank", "noopener"); }, 650);
      form.reset();
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
