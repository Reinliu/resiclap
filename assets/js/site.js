(function () {
  "use strict";

  var current = null;

  function play(button, src) {
    if (current && current.button === button) {
      current.audio.pause();
      button.classList.remove("playing");
      button.textContent = "\u25B6";
      current = null;
      return;
    }
    if (current) {
      current.audio.pause();
      current.button.classList.remove("playing");
      current.button.textContent = "\u25B6";
    }
    var audio = new Audio(src);
    button.classList.add("playing");
    button.textContent = "\u25A0";
    audio.addEventListener("ended", function () {
      button.classList.remove("playing");
      button.textContent = "\u25B6";
      current = null;
    });
    audio.play().catch(function () {
      button.classList.remove("playing");
      button.textContent = "\u25B6";
      current = null;
    });
    current = { audio: audio, button: button };
  }

  function playButton(src) {
    var button = document.createElement("button");
    button.className = "play";
    button.textContent = "\u25B6";
    if (!src) {
      button.disabled = true;
      button.title = "Audio unavailable";
      return button;
    }
    button.setAttribute("aria-label", "Play audio");
    button.addEventListener("click", function () { play(button, src); });
    return button;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // ---------------------------------------------------------------- demo
  function initDemo() {
    var mount = document.getElementById("results");
    if (!mount || !window.RETRIEVAL) return;

    var queries = window.RETRIEVAL.queries;
    var materialSel = document.getElementById("material");
    var factorSel = document.getElementById("factor");
    var directionSel = document.getElementById("direction");

    function unique(key) {
      var seen = [];
      queries.forEach(function (q) {
        if (seen.indexOf(q[key]) === -1) seen.push(q[key]);
      });
      return seen;
    }

    function fill(select, values, labels) {
      select.innerHTML = "";
      values.forEach(function (value, index) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = labels ? labels[index] : value;
        select.appendChild(option);
      });
    }

    var materials = unique("material");
    var factors = unique("factor");
    fill(materialSel, materials);
    fill(factorSel, factors);

    function refreshDirections() {
      var matching = queries.filter(function (q) {
        return q.factor === factorSel.value;
      });
      var seen = [];
      var labels = [];
      matching.forEach(function (q) {
        if (seen.indexOf(q.direction) === -1) {
          seen.push(q.direction);
          labels.push(q.direction_label);
        }
      });
      var previous = directionSel.value;
      fill(directionSel, seen, labels);
      if (seen.indexOf(previous) !== -1) directionSel.value = previous;
    }

    function panel(title, block, isWinner) {
      var node = el("div", "panel" + (isWinner ? " win" : ""));
      var header = el("header");
      header.appendChild(el("h3", null, title));
      header.appendChild(
        el("span", "score",
           "nDCG@10 " + block.ndcg_at_10.toFixed(3))
      );
      node.appendChild(header);
      block.results.forEach(function (item) {
        var row = el("div", "row");
        row.appendChild(el("span", "rank", String(item.rank)));
        row.appendChild(playButton(item.audio_url));
        var info = el("div", "info");
        info.appendChild(el("div", "name", item.object_name));
        info.appendChild(
          el("div", "sub",
             "strike " + item.strike_point +
             " \u00B7 mic ring " + item.mic_ring +
             " / " + item.mic_angle_deg + "\u00B0" +
             " \u00B7 z=" + item.target_z.toFixed(2) +
             " \u00B7 sim " + item.score.toFixed(3))
        );
        row.appendChild(info);
        row.appendChild(
          el("span", "pill " + (item.relevant ? "good" : "bad"),
             item.relevant ? "match" : "miss")
        );
        node.appendChild(row);
      });
      return node;
    }

    function render() {
      var query = null;
      for (var i = 0; i < queries.length; i++) {
        if (queries[i].material === materialSel.value &&
            queries[i].factor === factorSel.value &&
            queries[i].direction === directionSel.value) {
          query = queries[i];
          break;
        }
      }
      var summary = document.getElementById("query-summary");
      var anchorMount = document.getElementById("anchors");
      mount.innerHTML = "";
      summary.innerHTML = "";
      anchorMount.innerHTML = "";
      if (!query) {
        summary.appendChild(el("div", "meta", "No query for that combination."));
        return;
      }
      summary.appendChild(el("div", "query", "\u201C" + query.text + "\u201D"));
      var delta = resiNdcg(query) - clapNdcg(query);
      var meta = el("div", "meta");
      meta.textContent =
        "Matches require both the requested material and property direction";
      summary.appendChild(meta);
      var badge = el(
        "span",
        "deltapill " + (delta > 0 ? "good" : delta < 0 ? "bad" : "flat"),
        (delta > 0 ? "+" : "") + delta.toFixed(3) + " nDCG@10"
      );
      summary.appendChild(badge);
      renderAnchors(anchorMount, query);
      var clap = query.models.clap;
      var resi = query.models.resiclap;
      mount.appendChild(panel("Frozen CLAP", clap,
                              clap.ndcg_at_10 > resi.ndcg_at_10));
      mount.appendChild(panel("ResiCLAP", resi,
                              resi.ndcg_at_10 >= clap.ndcg_at_10));
    }

    function renderAnchors(mountNode, query) {
      if (!query.anchors) return;
      var box = el("div", "anchorbox");
      box.appendChild(
        el("h3", null,
           "Calibrate your ears: " + query.factor_label + " extremes in " +
           query.material)
      );
      box.appendChild(
        el("p", "hint",
           (query.factor === "decay"
             ? "These are the shortest- and longest-ringing natural " +
               query.material + " recordings in the pool."
             : "These use the strongest sweep setting on the exact " +
               "same source recording, so object, strike and microphone stay " +
               "fixed. They are exaggerated calibration examples, not ranked " +
               "retrieval results.") +
           " Play them back to back first.")
      );
      var row = el("div", "anchorrow");
      [["Lowest", query.anchors.low], ["Highest", query.anchors.high]]
        .forEach(function (pair) {
          var item = el("div", "anchor");
          item.appendChild(playButton(pair[1].audio_url));
          var info = el("div", "info");
          info.appendChild(
            el("div", "name",
               pair[0] + " " + query.factor_label.toLowerCase())
          );
          info.appendChild(
            el("div", "sub",
               pair[1].showcase_label
                 ? pair[1].object_name + " · " + pair[1].showcase_label
                 : pair[1].object_name + " · strike " +
                   pair[1].strike_point +
                   " · z=" + pair[1].target_z.toFixed(2))
          );
          item.appendChild(info);
          row.appendChild(item);
        });
      box.appendChild(row);
      mountNode.appendChild(box);
    }

    function clapNdcg(q) { return q.models.clap.ndcg_at_10; }
    function resiNdcg(q) { return q.models.resiclap.ndcg_at_10; }

    function select(material, factor, direction) {
      materialSel.value = material;
      factorSel.value = factor;
      refreshDirections();
      directionSel.value = direction;
      render();
    }

    materialSel.addEventListener("change", render);
    factorSel.addEventListener("change", function () {
      refreshDirections();
      render();
    });
    directionSel.addEventListener("change", render);

    Array.prototype.forEach.call(
      document.querySelectorAll(".chip"),
      function (chip) {
        chip.addEventListener("click", function () {
          select(chip.dataset.material, chip.dataset.factor,
                 chip.dataset.direction);
        });
      }
    );

    var start = window.DEMO_DEFAULT;
    if (start) {
      select(start.material, start.factor, start.direction);
    } else {
      refreshDirections();
      render();
    }
  }

  initDemo();
})();
