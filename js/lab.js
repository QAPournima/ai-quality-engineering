(function () {
  var inspect = document.getElementById("lab-inspect");
  if (!inspect) return;

  var title = inspect.querySelector("[data-inspect-title]");
  var labels = { agent: "AI QA Agent", synth: "Synthetic monitoring", mobile: "Mobile automation" };
  var hotspots = Array.prototype.slice.call(document.querySelectorAll("[data-open]"));
  var timer;

  function reduced() {
    return document.documentElement.getAttribute("data-motion") === "reduce";
  }

  function setExpanded(id) {
    hotspots.forEach(function (btn) {
      btn.setAttribute("aria-expanded", btn.getAttribute("data-open") === id ? "true" : "false");
    });
  }

  function closePanel() {
    inspect.hidden = true;
    inspect.querySelectorAll("[data-panel]").forEach(function (el) {
      el.hidden = true;
    });
    setExpanded("");
    if (location.hash === "#observability" || location.hash === "#agent" || location.hash === "#mobile") {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  function openPanel(id) {
    var panel = inspect.querySelector('[data-panel="' + id + '"]');
    if (!panel) return;
    inspect.hidden = false;
    inspect.querySelectorAll("[data-panel]").forEach(function (el) {
      el.hidden = el !== panel;
    });
    if (title) {
      title.textContent = labels[id] || "Station";
      title.setAttribute("tabindex", "-1");
      title.focus();
    }
    setExpanded(id);
    inspect.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" });
  }

  document.addEventListener("click", function (e) {
    var open = e.target.closest("[data-open]");
    if (open) {
      e.preventDefault();
      var id = open.getAttribute("data-open");
      if (open.getAttribute("aria-expanded") === "true") closePanel();
      else openPanel(id);
      return;
    }
    if (e.target.closest("[data-inspect-close]")) closePanel();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !inspect.hidden) {
      e.preventDefault();
      closePanel();
    }
  });

  function fromHash() {
    var hash = location.hash.replace("#", "");
    if (hash === "observability") openPanel("synth");
    if (hash === "agent") openPanel("agent");
    if (hash === "mobile") openPanel("mobile");
  }
  fromHash();
  window.addEventListener("hashchange", fromHash);

  var steps = document.querySelectorAll(".screen [data-step]");
  function tick(i) {
    if (!steps.length || reduced()) {
      steps.forEach(function (step) {
        step.classList.add("is-on");
      });
      return;
    }
    steps.forEach(function (step, n) {
      step.classList.toggle("is-on", n === i);
    });
    timer = window.setTimeout(function () {
      tick((i + 1) % steps.length);
    }, 1400);
  }
  if (timer) window.clearTimeout(timer);
  tick(0);
})();
