(function () {
  var lines = {
    lobby: "Welcome to Pournima HQ. Pick a door — or walk the Wall of Fame.",
    lab: "Welcome to the QA Lab. Want to see how my AI test agent works?",
    dev: "This is where I experiment with AI-assisted development.",
    office: "Here's my engineering journey — desk, wall, and bookshelf.",
    fame: "These are some of the things I've built. Hover a frame, then click."
  };
  var room = document.body.getAttribute("data-room") || "lobby";
  var p = document.querySelector("[data-guide-text]");
  if (p && lines[room]) p.textContent = lines[room];

  var building = document.querySelector("[data-parallax]");
  if (building) {
    window.addEventListener("mousemove", function (e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 8;
      var y = (e.clientY / window.innerHeight - 0.5) * 8;
      building.style.transform = "translate(" + x + "px," + y + "px)";
    });
  }
})();
