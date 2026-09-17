(function () {
  var html = document.documentElement;
  var root = document.body.getAttribute("data-root") || "./";
  var routes = {
    "1": root + "index.html",
    "2": root + "qa-lab.html",
    "3": root + "dev-studio.html",
    "4": root + "office.html",
    "5": root + "fame.html",
    j: root + "journey.html",
    J: root + "journey.html"
  };

  function storedMotion() {
    try {
      return localStorage.getItem("hq-motion");
    } catch (e) {
      return null;
    }
  }

  function prefersReduce() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function applyMotion(mode) {
    html.setAttribute("data-motion", mode);
    var btn = document.querySelector("[data-motion-toggle]");
    if (btn) {
      var reduced = mode === "reduce";
      btn.setAttribute("aria-pressed", reduced ? "true" : "false");
      btn.textContent = reduced ? "Motion off" : "Reduce motion";
    }
  }

  var initial = storedMotion() || (prefersReduce() ? "reduce" : "full");
  applyMotion(initial);

  document.addEventListener("click", function (e) {
    var toggle = e.target.closest("[data-motion-toggle]");
    if (!toggle) return;
    var next = html.getAttribute("data-motion") === "reduce" ? "full" : "reduce";
    applyMotion(next);
    try {
      localStorage.setItem("hq-motion", next);
    } catch (err) {}
  });

  var building = document.querySelector("[data-parallax]");
  if (building) {
    window.addEventListener("mousemove", function (e) {
      if (html.getAttribute("data-motion") === "reduce") {
        building.style.transform = "";
        return;
      }
      var x = (e.clientX / window.innerWidth - 0.5) * 8;
      var y = (e.clientY / window.innerHeight - 0.5) * 8;
      building.style.transform = "translate(" + x + "px," + y + "px)";
    });
  }

  document.addEventListener("click", function (e) {
    if (!e.target.closest("[data-skip-world]")) return;
    var map = document.getElementById("html-map");
    if (map && !document.body.classList.contains("world-on")) {
      map.scrollIntoView({ block: "start" });
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target && e.target.tagName) || "";
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (e.target && e.target.isContentEditable)) return;
    if (routes[e.key]) {
      e.preventDefault();
      window.location.href = routes[e.key];
    }
  });

  if (!document.querySelector(".mouse-spot")) {
    var spotEl = document.createElement("div");
    spotEl.className = "mouse-spot";
    spotEl.setAttribute("aria-hidden", "true");
    document.body.prepend(spotEl);
  }
  var spot = document.querySelector(".mouse-spot");
  var cards = ".door, .card, .frame, .panel, .hotspot";
  window.addEventListener("pointermove", function (e) {
    if (html.getAttribute("data-motion") === "reduce") {
      spot.style.opacity = "0";
      return;
    }
    spot.style.opacity = "1";
    spot.style.background =
      "radial-gradient(600px circle at " +
      e.clientX +
      "px " +
      e.clientY +
        "px, color-mix(in srgb, var(--tone) 26%, transparent), transparent 80%)";
    var card = e.target.closest(cards);
    if (!card) return;
    var r = card.getBoundingClientRect();
    card.style.setProperty("--lx", e.clientX - r.left + "px");
    card.style.setProperty("--ly", e.clientY - r.top + "px");
  }, { passive: true });
})();
