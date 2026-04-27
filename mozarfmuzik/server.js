const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// folders
["uploads", "uploads/audio", "uploads/covers"].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

app.use("/audio", express.static("uploads/audio"));
app.use("/covers", express.static("uploads/covers"));

// ===== DATA =====
let tracks = [];
let users = [{ id: 1, name: "guest", premium: false }];
let albums = [];
let streams = {};
let purchases = [];

// ===== UPLOAD =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "audio") cb(null, "uploads/audio");
    else cb(null, "uploads/covers");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

app.post("/upload", upload.fields([
  { name: "audio" },
  { name: "cover" }
]), (req, res) => {
  const track = {
    id: Date.now(),
    title: req.body.title,
    artist: req.body.artist,
    audio: "/audio/" + req.files.audio[0].filename,
    cover: "/covers/" + req.files.cover[0].filename,
    streams: 0
  };

  tracks.push(track);
  res.json(track);
});

// ===== STREAM TRACK =====
app.post("/stream/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const track = tracks.find(t => t.id === id);
  if (track) {
    track.streams++;
    streams[id] = (streams[id] || 0) + 1;
  }
  res.json({ ok: true });
});

// ===== ALBUM =====
app.post("/create-album", (req, res) => {
  const album = {
    id: Date.now(),
    title: req.body.title,
    price: parseFloat(req.body.price)
  };
  albums.push(album);
  res.json(album);
});

// ===== BUY =====
app.post("/buy", (req, res) => {
  const { userId, albumId } = req.body;

  const user = users.find(u => u.id === userId);
  const album = albums.find(a => a.id === albumId);

  let price = album.price;
  if (user.premium) price *= 0.9;

  purchases.push({ userId, albumId, price });

  res.json({ success: true, price });
});

// ===== PREMIUM =====
app.post("/premium/:id", (req, res) => {
  const user = users.find(u => u.id == req.params.id);
  user.premium = true;
  res.json({ premium: true });
});

// ===== DATA =====
app.get("/tracks", (req, res) => res.json(tracks));
app.get("/albums", (req, res) => res.json(albums));

// ===== FRONT =====
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>MOZARFMUZIK</title>
<style>
body { font-family:sans-serif; margin:0; background:white; }
.sidebar { width:200px; position:fixed; height:100%; border-right:1px solid #eee; padding:20px; }
.main { margin-left:200px; padding:20px; }
.grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
.card { cursor:pointer; }
.player { position:fixed; bottom:0; left:200px; right:0; border-top:1px solid #eee; padding:10px; display:flex; justify-content:space-between; background:white;}
button { cursor:pointer; }
</style>
</head>

<body>

<div class="sidebar">
<h2>MOZARFMUZIK</h2>
<button onclick="go('tracks')">Tracks</button>
<button onclick="go('albums')">Albums</button>
<button onclick="becomePremium()">Premium</button>
</div>

<div class="main" id="content"></div>

<div class="player" id="player" style="display:none;">
<div><span id="title"></span></div>
<button onclick="toggle()">Play/Pause</button>
</div>

<audio id="audio"></audio>

<script>
let current = null;
let playing = false;
let userId = 1;

function go(page){
  if(page==='tracks') loadTracks();
  if(page==='albums') loadAlbums();
}

function loadTracks(){
  fetch('/tracks').then(r=>r.json()).then(data=>{
    let html = '<h1>Tracks</h1><div class="grid">';
    data.forEach(t=>{
      html += \`
      <div class="card" onclick="play(\${t.id})">
        <img src="\${t.cover}" width="100%">
        <p>\${t.title}</p>
        <p>\${t.artist}</p>
        <small>\${t.streams} streams</small>
      </div>\`;
    });
    html += '</div>';
    document.getElementById('content').innerHTML = html;
  });
}

function loadAlbums(){
  fetch('/albums').then(r=>r.json()).then(data=>{
    let html = '<h1>Albums</h1>';
    data.forEach(a=>{
      html += \`
      <div>
        <p>\${a.title} - \${a.price}€</p>
        <button onclick="buy(\${a.id}, \${a.price})">Acheter</button>
      </div>\`;
    });
    document.getElementById('content').innerHTML = html;
  });
}

function play(id){
  fetch('/tracks').then(r=>r.json()).then(data=>{
    const t = data.find(x=>x.id===id);
    current = t;

    const audio = document.getElementById('audio');
    audio.src = t.audio;
    audio.play();
    playing = true;

    fetch('/stream/'+id, {method:'POST'});

    document.getElementById('player').style.display='flex';
    document.getElementById('title').innerText = t.title;
  });
}

function toggle(){
  const audio = document.getElementById('audio');
  if(playing) audio.pause(); else audio.play();
  playing = !playing;
}

function buy(albumId, price){
  fetch('/buy',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({userId, albumId})
  })
  .then(r=>r.json())
  .then(d=>alert("Payé: "+d.price+"€"));
}

function becomePremium(){
  fetch('/premium/'+userId,{method:'POST'})
  .then(()=>alert("Tu es premium (-10%)"));
}

go('tracks');
</script>

</body>
</html>
`);
});

// ===== START =====
app.listen(PORT, () => {
  console.log("🔥 MOZARFMUZIK running http://localhost:" + PORT);
});
