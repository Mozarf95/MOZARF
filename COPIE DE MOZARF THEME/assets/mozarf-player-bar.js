// MOZARF — Barre de lecture fixe avec tracklist
(function () {
  const bar = document.getElementById('mozarf-bar');
  if (!bar) return;

  function normalizeCoverUrl(u) {
    if (!u || typeof u !== 'string') return '';
    if (u.indexOf('//') === 0) return 'https:' + u;
    return u;
  }

  function normalizeTrack(t) {
    if (!t || typeof t !== 'object') return null;
    var src = t.src;
    if (src && typeof src === 'object' && src.error) src = '';
    if (typeof src !== 'string') src = String(src || '').trim();
    var productUrl = t.productUrl || t.url || '';
    if (productUrl && typeof productUrl === 'object' && productUrl.error) productUrl = '';
    productUrl = String(productUrl || '').trim();
    var title = (t.title != null ? String(t.title) : '—').trim() || '—';
    return {
      title: title,
      src: src,
      url: productUrl,
      productUrl: productUrl,
    };
  }

  function normalizeTracks(tracks) {
    if (!Array.isArray(tracks)) return [];
    var out = [];
    tracks.forEach(function (t) {
      var n = normalizeTrack(t);
      if (n) out.push(n);
    });
    return out;
  }

  const cover = document.getElementById('mozarf-bar__cover');
  const title = document.getElementById('mozarf-bar__title');
  const artist = document.getElementById('mozarf-bar__artist');
  const btnPlay = document.getElementById('mozarf-bar__play');
  const btnPrev = document.getElementById('mozarf-bar__prev');
  const btnNext = document.getElementById('mozarf-bar__next');
  const btnClose = document.getElementById('mozarf-bar__close');
  const btnTracklist = document.getElementById('mozarf-bar__tracklist');
  const tracklist = document.getElementById('mozarf-tracklist');
  const tracklistUl = document.getElementById('mozarf-tracklist__list');
  const audio = document.getElementById('mozarf-bar__audio');

  let tracks = [];
  let currentIndex = 0;
  let isPlaying = false;

  // Créer le bouton Acheter
  const btnBuy = document.createElement('a');
  btnBuy.id = 'mozarf-bar__buy';
  btnBuy.textContent = 'Acheter';
  btnBuy.target = '_blank';
  btnBuy.style.display = 'none';
  btnBuy.style.marginLeft = '12px';
  btnBuy.style.padding = '4px 12px';
  btnBuy.style.background = '#fff';
  btnBuy.style.color = '#000';
  btnBuy.style.borderRadius = '20px';
  btnBuy.style.fontWeight = 'bold';
  btnBuy.style.fontSize = '12px';
  btnBuy.style.textDecoration = 'none';
  title.parentNode.insertBefore(btnBuy, title.nextSibling);

  function loadAlbum(data) {
    tracks = normalizeTracks(data.tracks || []);
    title.textContent = data.title || '—';
    artist.textContent = data.artist || 'MOZARF';
    var c = normalizeCoverUrl(data.cover || '');
    cover.src = c;
    cover.style.display = c ? 'block' : 'none';
    bar.classList.add('mozarf-bar--visible');
    renderTracklist();
    var firstPlayable = tracks.findIndex(function (tr) {
      return tr.src;
    });
    if (firstPlayable >= 0) {
      loadTrack(firstPlayable);
    } else if (tracks.length) {
      loadTrack(0);
    }
  }

  function renderTracklist() {
    tracklistUl.innerHTML = '';
    tracks.forEach(function (track, index) {
      const li = document.createElement('li');
      li.textContent = (index + 1) + '. ' + track.title;
      li.dataset.index = index;
      li.addEventListener('click', function () {
        loadTrack(index);
        tracklist.classList.remove('mozarf-tracklist--visible');
      });
      tracklistUl.appendChild(li);
    });
  }

  function updateTracklistActive() {
    const items = tracklistUl.querySelectorAll('li');
    items.forEach(function (li, i) {
      li.classList.toggle('active', i === currentIndex);
    });
  }

  function loadTrack(index) {
    if (!tracks[index]) return;
    currentIndex = index;
    if (tracks[index].src) {
      audio.src = tracks[index].src;
      audio.play();
      isPlaying = true;
    } else {
      isPlaying = false;
    }
    title.textContent = tracks[index].title;

    var buyHref = tracks[index].productUrl || tracks[index].url;
    if (buyHref) {
      btnBuy.href = buyHref;
      btnBuy.style.display = 'inline-block';
    } else {
      btnBuy.style.display = 'none';
    }

    updateTracklistActive();
    updatePlayBtn();
  }

  function updatePlayBtn() {
    btnPlay.innerHTML = isPlaying
      ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
      : '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z"/></svg>';
  }

  btnPlay.addEventListener('click', function () {
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
    } else {
      audio.play();
      isPlaying = true;
    }
    updatePlayBtn();
  });

  btnPrev.addEventListener('click', function () {
    if (currentIndex > 0) loadTrack(currentIndex - 1);
  });

  btnNext.addEventListener('click', function () {
    if (currentIndex < tracks.length - 1) loadTrack(currentIndex + 1);
  });

  btnTracklist.addEventListener('click', function () {
    tracklist.classList.toggle('mozarf-tracklist--visible');
  });

  btnClose.addEventListener('click', function () {
    bar.classList.remove('mozarf-bar--visible');
    tracklist.classList.remove('mozarf-tracklist--visible');
    audio.pause();
    isPlaying = false;
  });

  audio.addEventListener('ended', function () {
    if (currentIndex < tracks.length - 1) {
      loadTrack(currentIndex + 1);
    } else {
      isPlaying = false;
      updatePlayBtn();
    }
  });

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.mozarf-js-open-player');
    if (!btn) return;
    const card = btn.closest('[data-mozarf-album]');
    if (!card) return;
    const raw = card.getAttribute('data-mozarf-album');
    if (!raw) return;
    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      return;
    }
    loadAlbum(data);
    tracklist.classList.add('mozarf-tracklist--visible');
  });

  window.mozarfLoadAlbum = loadAlbum;
})();
