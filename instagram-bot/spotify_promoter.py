"""
Intégration Spotify + Mozarf.fl — promotion automatique des nouveaux sons.

Fonctions :
- Détecte quand un nouveau son sort sur Spotify
- Génère automatiquement un post Instagram de promotion
- Ajoute le lien direct dans la bio
- Programme les posts de promotion sur 7 jours
"""

import json
import requests
import base64
from datetime import datetime, timedelta
from pathlib import Path
from caption_generator import generate_caption
from poster import add_post_to_queue
from config import ANTHROPIC_API_KEY

SPOTIFY_CONFIG_FILE = "spotify_config.json"
PROMOTED_TRACKS_FILE = "promoted_tracks.json"

# Config Spotify (à remplir dans spotify_config.json)
DEFAULT_CONFIG = {
    "artist_name": "MOZARF",
    "spotify_artist_id": "",        # ID Spotify de l'artiste
    "spotify_client_id": "",        # Depuis developer.spotify.com
    "spotify_client_secret": "",    # Depuis developer.spotify.com
    "mozarf_fl_profile_url": "",    # URL de ton profil sur mozarf.fl
}


def load_spotify_config() -> dict:
    if not Path(SPOTIFY_CONFIG_FILE).exists():
        with open(SPOTIFY_CONFIG_FILE, "w") as f:
            json.dump(DEFAULT_CONFIG, f, indent=2)
        print(f"⚠️  Remplis {SPOTIFY_CONFIG_FILE} avec tes credentials Spotify")
        return DEFAULT_CONFIG
    with open(SPOTIFY_CONFIG_FILE) as f:
        return json.load(f)


def get_spotify_token(client_id: str, client_secret: str) -> str:
    """Récupère un token Spotify via Client Credentials Flow."""
    credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    response = requests.post(
        "https://accounts.spotify.com/api/token",
        headers={"Authorization": f"Basic {credentials}"},
        data={"grant_type": "client_credentials"},
    )
    return response.json().get("access_token", "")


def get_latest_tracks(artist_id: str, token: str, limit: int = 5) -> list:
    """Récupère les derniers sons de l'artiste sur Spotify."""
    headers = {"Authorization": f"Bearer {token}"}
    url = f"https://api.spotify.com/v1/artists/{artist_id}/top-tracks?market=FR"
    response = requests.get(url, headers=headers)
    tracks = response.json().get("tracks", [])

    return [
        {
            "id": t["id"],
            "name": t["name"],
            "url": t["external_urls"]["spotify"],
            "preview_url": t.get("preview_url"),
            "album_image": t["album"]["images"][0]["url"] if t["album"]["images"] else None,
            "release_date": t["album"]["release_date"],
        }
        for t in tracks[:limit]
    ]


def load_promoted_tracks() -> set:
    if not Path(PROMOTED_TRACKS_FILE).exists():
        return set()
    with open(PROMOTED_TRACKS_FILE) as f:
        return set(json.load(f))


def save_promoted_tracks(promoted: set):
    with open(PROMOTED_TRACKS_FILE, "w") as f:
        json.dump(list(promoted), f)


def promote_track(track: dict, promo_image: str = None):
    """
    Programme une campagne de promotion Instagram pour un son Spotify.
    Crée 3 posts sur 7 jours.
    """
    promoted = load_promoted_tracks()
    if track["id"] in promoted:
        print(f"ℹ️  '{track['name']}' déjà promu, skip")
        return

    spotify_url = track["url"]
    track_name = track["name"]

    # Caption jour J
    caption_day0 = (
        f"Nouveau son disponible maintenant. 🎵\n\n"
        f"{track_name}\n\n"
        f"🎧 {spotify_url}"
    )

    # Caption J+3
    caption_day3 = generate_caption(
        "lifestyle",
        track_name,
        f"promotion du son {track_name} sur Spotify",
    ) + f"\n\n🎵 {spotify_url}"

    # Caption J+7
    caption_day7 = (
        f"Si tu l'as pas encore écouté. 👀\n\n"
        f"🎧 {spotify_url}"
    )

    hashtags = (
        "#mozarf #mozarfparis #newmusic #nouveauson #spotify "
        "#paris #musique #drop #rapper #artiste #independent"
    )

    image = promo_image or "posts_queue/001/image.jpg"

    today = datetime.now()
    posts = [
        (today, caption_day0),
        (today + timedelta(days=3), caption_day3),
        (today + timedelta(days=7), caption_day7),
    ]

    for i, (post_date, caption) in enumerate(posts):
        folder = f"spotify_{track['id']}_{i}"
        add_post_to_queue(image, caption, hashtags, folder)
        print(f"   📅 {post_date.strftime('%Y-%m-%d')} → post {i+1} ajouté")

    promoted.add(track["id"])
    save_promoted_tracks(promoted)
    print(f"✅ Campagne Spotify créée pour '{track_name}' — 3 posts programmés")


def auto_promote_new_releases(promo_image: str = None):
    """
    Vérifie les nouveaux sons et lance la promotion automatiquement.
    À appeler depuis le scheduler.
    """
    config = load_spotify_config()

    if not config.get("spotify_client_id") or not config.get("spotify_artist_id"):
        print("⚠️  Configure spotify_config.json pour activer la promotion auto")
        return

    token = get_spotify_token(config["spotify_client_id"], config["spotify_client_secret"])
    if not token:
        print("❌ Impossible de se connecter à Spotify — vérifie tes credentials")
        return

    tracks = get_latest_tracks(config["spotify_artist_id"], token)
    promoted = load_promoted_tracks()

    new_tracks = [t for t in tracks if t["id"] not in promoted]

    if not new_tracks:
        print("✅ Pas de nouveau son à promouvoir")
        return

    for track in new_tracks:
        print(f"🎵 Nouveau son détecté : {track['name']}")
        promote_track(track, promo_image)


def generate_mozarf_fl_promo_post(track_name: str, mozarf_fl_url: str) -> str:
    """Génère un post de promotion pour mozarf.fl."""
    return (
        f"{track_name} — maintenant sur Mozarf. 🤍\n\n"
        f"Écoute + télécharge : {mozarf_fl_url}\n\n"
        f"Lien en bio ↑"
    )


if __name__ == "__main__":
    config = load_spotify_config()
    print(f"Config Spotify : {SPOTIFY_CONFIG_FILE}")
    print("Remplis l'artist_id et les credentials pour activer.")
    print("\nPour trouver ton Spotify Artist ID :")
    print("  → Ouvre ton profil Spotify")
    print("  → L'ID est dans l'URL : spotify.com/artist/[TON_ID_ICI]")
