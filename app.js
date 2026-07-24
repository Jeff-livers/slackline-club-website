// Salida Slackline Club — feed behaviour. See ARCHITECTURE.md for how it fits together.
(function () {
  'use strict';

  var CLUB_NAME = 'Salida Slackline Club';
  var MEETING_INFO = 'Thursdays, 6:00pm at Thonhoff Park';

  var PILL_H_PADDING = 30;   // pill inner padding, both sides
  var SOUND_BTN_SPACE = 56;  // 44px button + 12px gap
  var EDGE_MARGIN = 16;      // viewport breathing room, both sides
  var PILL_MAX_WIDTH = 450;  // title stops growing past this
  var INFO_MAX_FONT = 18;    // meeting line stays below the title

  var SOUND_ICONS =
    '<svg class="icon-off" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path fill="#fff" d="M3 9v6h4l5 5V4L7 9H3z"/>' +
      '<path d="M16 9l5 6M21 9l-5 6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '</svg>' +
    '<svg class="icon-on" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path fill="#fff" d="M3 9v6h4l5 5V4L7 9H3z"/>' +
      '<path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '</svg>';

  var heroVideo = document.getElementById('bgvid');
  heroVideo.play().catch(function () {
    heroVideo.style.display = 'none';
    document.getElementById('bgimg').style.display = 'block';
  });

  function fitText(el, available) {
    el.style.fontSize = '100px';
    return 100 * available / el.scrollWidth;
  }

  function fitTitle(el) {
    var cap = PILL_MAX_WIDTH - EDGE_MARGIN - SOUND_BTN_SPACE - PILL_H_PADDING;
    var viewport = window.innerWidth - EDGE_MARGIN - SOUND_BTN_SPACE - PILL_H_PADDING;
    el.style.fontSize = fitText(el, Math.min(viewport, cap)) + 'px';
  }

  function fitInfo(el) {
    var available = window.innerWidth - EDGE_MARGIN - SOUND_BTN_SPACE - PILL_H_PADDING;
    el.style.fontSize = Math.min(fitText(el, available), INFO_MAX_FONT) + 'px';
  }

  window.addEventListener('resize', function () {
    document.querySelectorAll('.panel-title').forEach(fitTitle);
    document.querySelectorAll('.video-panel .info').forEach(fitInfo);
  });

  var panels = [];
  var soundButtons = [];
  var unlocked = false;

  var music = document.getElementById('feedmusic');
  var musicOn = false;

  function inView(panel) {
    var rect = panel.getBoundingClientRect();
    var mid = window.innerHeight / 2;
    return rect.top < mid && rect.bottom > mid;
  }

  function tryPlay(p) {
    var pending = p.vid.play();
    if (pending && pending.then) {
      pending
        .then(function () { p.panel.classList.remove('is-paused'); })
        .catch(function () { p.panel.classList.add('is-paused'); });
    }
  }

  function unlockAll() {
    if (unlocked) return;
    unlocked = true;
    panels.forEach(function (p) {
      var pending = p.vid.play();
      if (pending && pending.then) {
        pending.then(function () {
          if (!inView(p.panel)) {
            p.vid.pause();
            p.vid.currentTime = 0;
          }
        }).catch(function () {});
      }
    });
  }

  function syncSoundButtons() {
    soundButtons.forEach(function (btn) {
      btn.classList.toggle('is-on', musicOn);
      btn.setAttribute('aria-label', musicOn ? 'Mute' : 'Unmute');
    });
  }

  function toggleSound() {
    musicOn = !musicOn;
    if (musicOn) {
      var pending = music.play();
      if (pending && pending.then) {
        pending.catch(function () {
          musicOn = false;
          syncSoundButtons();
        });
      }
    } else {
      music.pause();
    }
    syncSoundButtons();
  }

  function makeSoundButton() {
    var btn = document.createElement('button');
    btn.className = 'sound-btn';
    btn.setAttribute('aria-label', 'Unmute');
    btn.innerHTML = SOUND_ICONS;
    btn.classList.toggle('is-on', musicOn);
    btn.addEventListener('click', toggleSound);
    soundButtons.push(btn);
    return btn;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var idx = +entry.target.dataset.idx;
      var p = panels[idx];
      if (!p) return;
      if (entry.isIntersecting) {
        tryPlay(p);
        var next = panels[idx + 1];
        if (next && next.vid.preload !== 'auto') {
          next.vid.preload = 'auto';
          next.vid.load();
        }
      } else {
        p.vid.pause();
        p.vid.currentTime = 0;
        p.panel.classList.remove('is-paused');
      }
    });
  }, { threshold: 0.6 });

  function buildPanel(clip, idx) {
    var panel = document.createElement('div');
    panel.className = 'video-panel';
    panel.dataset.idx = idx;

    var vid = document.createElement('video');
    vid.className = 'bg';
    vid.muted = true;
    vid.loop = true;
    vid.poster = clip.poster;
    vid.setAttribute('playsinline', '');
    vid.setAttribute('webkit-playsinline', '');
    vid.setAttribute('preload', 'none');
    var source = document.createElement('source');
    source.src = clip.src;
    source.type = 'video/mp4';
    vid.appendChild(source);

    var p = { panel: panel, vid: vid };

    var playBtn = document.createElement('button');
    playBtn.className = 'play-btn';
    playBtn.setAttribute('aria-label', 'Play video');
    playBtn.addEventListener('click', function () {
      unlockAll();
      tryPlay(p);
    });

    var title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = CLUB_NAME;

    var info = document.createElement('div');
    info.className = 'info';
    info.textContent = MEETING_INFO;

    var footer = document.createElement('div');
    footer.className = 'panel-footer';
    footer.appendChild(title);
    footer.appendChild(info);

    var bottom = document.createElement('div');
    bottom.className = 'panel-bottom';
    bottom.appendChild(footer);
    bottom.appendChild(makeSoundButton());

    panel.appendChild(vid);
    panel.appendChild(playBtn);
    panel.appendChild(bottom);
    document.body.appendChild(panel);

    fitTitle(title);
    fitInfo(info);
    panels.push(p);
    observer.observe(panel);
  }

  fetch('/videos.json')
    .then(function (response) { return response.json(); })
    .then(function (clips) { clips.forEach(buildPanel); });
})();
