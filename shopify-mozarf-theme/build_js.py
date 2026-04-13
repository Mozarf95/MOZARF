#!/usr/bin/env python3
import pathlib

root = pathlib.Path(__file__).resolve().parent
raw = (root / "assets/mozarf-platform.js.raw").read_text()

MAP_FN = r'''    function gradientFromSeed(seed) {
      var g = [
        "linear-gradient(160deg, #1a1a1a 0%, #3a3a3a 50%, #0c0c0e 100%)",
        "linear-gradient(145deg, #1a0a12 0%, #4a2a30 50%, #0c0c0e 100%)",
        "linear-gradient(145deg, #1a0a0a 0%, #ff3d5c 40%, #2a1810 100%)",
        "linear-gradient(160deg, #0e1a12 0%, #e8ff4a 35%, #0c0c0e 100%)",
        "linear-gradient(135deg, #121820 0%, #4d8f82 50%, #ffc233 100%)",
        "linear-gradient(145deg, #2a1f08 0%, #ffc233 30%, #1a1510 100%)",
        "linear-gradient(125deg, #0c0c0e 0%, #ff3d5c 25%, #2a1040 90%)",
        "linear-gradient(220deg, #0a1628 0%, #4d8f82 40%, #0c0c0e 100%)",
      ];
      var h = 0;
      var s = String(seed);
      for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return g[h % g.length];
    }

    function mapShopifyProduct(p) {
      var price = (
        typeof p.price_cents === "number"
          ? p.price_cents / 100
          : typeof p.price === "number"
            ? p.price
            : parseFloat(p.price) || 0
      );
      var lic = Math.round(price * 1.45 * 100) / 100;
      var tags = (p.tags || []).map(function (t) {
        return String(t).toLowerCase();
      });
      if (!tags.length) tags = ["album"];
      var pt = (p.product_type && String(p.product_type).toLowerCase()) || "";
      var isSingle = pt.indexOf("single") >= 0;
      var img = p.image || "";
      var desc = p.description_plain || p.description || "";
      if (desc.length > 520) desc = desc.slice(0, 517) + "…";
      var id = "shopify-" + String(p.id);
      var trackTitle = "01 — " + (p.title || "Release");
      return {
        id: id,
        shopifyId: p.id,
        handle: p.handle || "",
        type: isSingle ? "single" : "album",
        title: p.title || "Sans titre",
        artist: p.vendor || "MOZARF",
        price: price,
        priceFormatted: p.price_formatted || "",
        defaultTrackBuy: price,
        defaultLicenseBuy: lic,
        bpm: "—",
        key: "—",
        tags: tags,
        grad: gradientFromSeed(id),
        coverImage: img,
        desc: desc || "Release MOZARF.",
        license: "Conditions d’achat sur la boutique officielle.",
        released: p.published_at || "—",
        location: "—",
        supporters: 0,
        approxMinutes: null,
        formats: ["Téléchargement HD — WAV + MP3 320", "Streaming intégral"],
        credits: (p.title || "") + " — " + (p.vendor || "MOZARF"),
        about: desc,
        tracks: [{ n: trackTitle, t: "—", tb: price, lb: lic }],
        productUrl: p.url || "",
        fromShopify: true,
      };
    }

'''

marker = "    /** Fenêtre drop homepage"
if marker not in raw:
    raise SystemExit("marker not found")
raw = raw.replace(marker, MAP_FN + marker, 1)

raw = raw.replace("    var CATALOG = [", "    var DEMO_CATALOG = [", 1)

old_block = """        tracks: buildTracks(A3_NAMES, A3_TIMES, 3, 26),
      },
    ];

    (function () {
      var el = document.getElementById("stat-item-count");
      if (el) el.textContent = String(CATALOG.length);
    })();"""

new_block = """        tracks: buildTracks(A3_NAMES, A3_TIMES, 3, 26),
      },
    ];

    var CATALOG = window.__MOZARF_SHOPIFY_PRODUCTS__ && window.__MOZARF_SHOPIFY_PRODUCTS__.length
      ? window.__MOZARF_SHOPIFY_PRODUCTS__.map(mapShopifyProduct)
      : DEMO_CATALOG;

    (function () {
      var dropHandle = window.__MOZARF_DROP_HANDLE__;
      if (dropHandle && typeof DROP_CAMPAIGN !== "undefined") {
        var matchP = (window.__MOZARF_SHOPIFY_PRODUCTS__ || []).filter(function (p) {
          return p.handle === dropHandle;
        })[0];
        if (matchP) {
          DROP_CAMPAIGN.albumId = "shopify-" + String(matchP.id);
        }
      }

      var el = document.getElementById("stat-item-count");
      if (el) el.textContent = String(CATALOG.length);
    })();"""

if old_block not in raw:
    raise SystemExit("catalog end block not found")
raw = raw.replace(old_block, new_block, 1)

raw = raw.replace(
    """        '<div class="card-price">' +
        esc(String(item.price)) +
        ",00 € <small>TTC</small></div>" +""",
    """        '<div class="card-price">' +
        esc(item.priceFormatted ? item.priceFormatted : euro(item.price)) +
        ' <small>TTC</small></div>' +""",
    1,
)

old_track = """            '<div class="track-row-actions">' +
            '<button type="button" class="btn-track-buy" data-demo-buy="' +
            esc(buyMsg) +
            '">Acheter · ' +
            buyP +
            "</button>" +
            '<button type="button" class="btn-track-lic" data-demo-buy="' +
            esc(licMsg) +
            '">Licence · ' +
            licP +
            "</button></div></div>"
"""

new_track = """            '<div class="track-row-actions">' +
            (item.productUrl
              ? '<a class="btn-track-buy" href="' + esc(item.productUrl) + '">Acheter · ' + buyP + "</a>"
              : '<button type="button" class="btn-track-buy" data-demo-buy="' +
                esc(buyMsg) +
                '">Acheter · ' +
                buyP +
                "</button>") +
            (item.productUrl
              ? '<a class="btn-track-lic" href="' + esc(item.productUrl) + '">Page produit · ' + licP + "</a>"
              : '<button type="button" class="btn-track-lic" data-demo-buy="' +
                esc(licMsg) +
                '">Licence · ' +
                licP +
                "</button>") +
            "</div></div>"
"""

if old_track not in raw:
    raise SystemExit("track row block not found")
raw = raw.replace(old_track, new_track, 1)

old_play = """      var playAllBtn = firstAud
        ? '<button type="button" class="btn btn-ghost" data-preview-url="' +
          audioUrl(firstAud.audioFile) +
          '" data-preview-label="' +
          esc(item.title + " — " + firstAud.n) +
          '">▶ Préécouter (1re piste)</button>'
        : '<button type="button" class="btn btn-ghost" data-demo-buy="' +
          esc("Aucun fichier audio lié à cette release dans audio/.") +
          '">▶ Préécouter tout</button>';"""

new_play = """      var playAllBtn = firstAud
        ? '<button type="button" class="btn btn-ghost" data-preview-url="' +
          audioUrl(firstAud.audioFile) +
          '" data-preview-label="' +
          esc(item.title + " — " + firstAud.n) +
          '">▶ Préécouter (1re piste)</button>'
        : item.productUrl
        ? '<a class="btn btn-ghost" href="' + esc(item.productUrl) + '">▶ Écouter / acheter sur la boutique</a>'
        : '<button type="button" class="btn btn-ghost" data-demo-buy="' +
          esc("Aucun fichier audio lié à cette release dans audio/.") +
          '">▶ Préécouter tout</button>';"""

if old_play not in raw:
    raise SystemExit("playAllBtn block not found")
raw = raw.replace(old_play, new_play, 1)

old_side = """        '<div class="bc-side-actions">' +
        '<button type="button" class="btn btn-hot" data-demo-buy="' +
        esc(albumBuyMsg) +
        '">Acheter la release</button>' +
        '<button type="button" class="btn btn-accent" data-demo-buy="' +
        esc(packLicMsg) +
        '">Pack licences (album)</button>' +
        '<button type="button" class="btn btn-ghost" data-demo-buy="' +
        esc(wishMsg) +
        '">♥ Liste de souhaits</button>' +
        playAllBtn +
        "</div>" +
"""

new_side = """        '<div class="bc-side-actions">' +
        (item.productUrl
          ? '<a class="btn btn-hot" href="' + esc(item.productUrl) + '">Acheter la release</a>'
          : '<button type="button" class="btn btn-hot" data-demo-buy="' +
            esc(albumBuyMsg) +
            '">Acheter la release</button>') +
        (item.productUrl
          ? '<a class="btn btn-accent" href="' + esc(item.productUrl) + '">Options & formats (Shopify)</a>'
          : '<button type="button" class="btn btn-accent" data-demo-buy="' +
            esc(packLicMsg) +
            '">Pack licences (album)</button>') +
        (item.productUrl
          ? '<a class="btn btn-ghost" href="' + esc(item.productUrl) + '">♥ Fiche produit</a>'
          : '<button type="button" class="btn btn-ghost" data-demo-buy="' +
            esc(wishMsg) +
            '">♥ Liste de souhaits</button>') +
        playAllBtn +
        "</div>" +
"""

if old_side not in raw:
    raise SystemExit("side actions block not found")
raw = raw.replace(old_side, new_side, 1)

old_price = """        '<div class="detail-price">' +
        euro(item.price) +
        "</div>" +"""

new_price = """        '<div class="detail-price">' +
        esc(item.priceFormatted ? item.priceFormatted : euro(item.price)) +
        "</div>" +"""

if old_price not in raw:
    raise SystemExit("detail price block not found")
raw = raw.replace(old_price, new_price, 1)

old_fans = """        '<p class="bc-fans">' +
        (item.supporters != null ? item.supporters : 0) +
        " soutiens sur cette release (démo)</p>" +"""

new_fans = """        (item.fromShopify
          ? ""
          : '<p class="bc-fans">' +
            (item.supporters != null ? item.supporters : 0) +
            " soutiens sur cette release (démo)</p>") +"""

if old_fans not in raw:
    raise SystemExit("fans block not found")
raw = raw.replace(old_fans, new_fans, 1)

# initDropCampaign: override activeUntil from window
old_init = """    function initDropCampaign() {
      var end = new Date(DROP_CAMPAIGN.activeUntil);"""

new_init = """    function initDropCampaign() {
      var until = window.__MOZARF_DROP_ACTIVE_UNTIL__ || DROP_CAMPAIGN.activeUntil;
      var end = new Date(until);"""

if old_init not in raw:
    raise SystemExit("initDropCampaign start not found")
raw = raw.replace(old_init, new_init, 1)

(root / "assets/mozarf-platform.js").write_text(raw)
print("Wrote assets/mozarf-platform.js")
