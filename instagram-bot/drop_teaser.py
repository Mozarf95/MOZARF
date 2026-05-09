"""
Campagne de teaser automatique avant un drop.

Calendrier automatique sur 5 jours :
  J-5 : Post mystère "quelque chose arrive"
  J-3 : Teaser visuel + story countdown
  J-1 : "Demain" — hype max
  J+0 : Post officiel du drop
  J+2 : Relance / dernier rappel
"""

import json
import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from caption_generator import generate_caption
from poster import add_post_to_queue

DROPS_FILE = "drops.json"

HASHTAGS_DROP = "#mozarf #mozarfparis #newdrop #paris #streetwear #mode #fashion #drop #newcollection #limited"


def load_drops() -> list:
    if not Path(DROPS_FILE).exists():
        return []
    with open(DROPS_FILE) as f:
        return json.load(f)


def save_drops(drops: list):
    with open(DROPS_FILE, "w") as f:
        json.dump(drops, f, indent=2, default=str)


def schedule_drop_campaign(
    drop_name: str,
    drop_date: str,
    main_image: str,
    teaser_image: str = None,
    spotify_link: str = "",
):
    """
    Programme automatiquement toute la campagne de teaser pour un drop.

    drop_date : format 'YYYY-MM-DD'
    main_image : chemin vers l'image principale du drop
    teaser_image : image floue/mystère pour les teasers (optionnel)
    spotify_link : lien Spotify du son lié au drop (optionnel)
    """
    drop_dt = datetime.strptime(drop_date, "%Y-%m-%d")
    teaser_img = teaser_image or main_image

    spotify_line = f"\n\n🎵 Le son : {spotify_link}" if spotify_link else ""
    spotify_bio_line = "\n\nLe son est en bio 🎵" if spotify_link else "\n\nLien en bio 👆"

    campaign = [
        {
            "day": (drop_dt - timedelta(days=5)).strftime("%Y-%m-%d"),
            "type": "teaser",
            "caption": generate_caption("teaser", drop_name, "J-5 avant le drop"),
            "image": teaser_img,
            "hashtags": HASHTAGS_DROP,
        },
        {
            "day": (drop_dt - timedelta(days=3)).strftime("%Y-%m-%d"),
            "type": "teaser",
            "caption": f"J-3. 👀\n\nÇa arrive." + spotify_bio_line,
            "image": teaser_img,
            "hashtags": HASHTAGS_DROP,
        },
        {
            "day": (drop_dt - timedelta(days=1)).strftime("%Y-%m-%d"),
            "type": "teaser",
            "caption": f"Demain. 🤍\n\n{drop_name} — disponible à minuit.",
            "image": teaser_img,
            "hashtags": HASHTAGS_DROP,
        },
        {
            "day": drop_date,
            "type": "new_drop",
            "caption": generate_caption("new_drop", drop_name) + spotify_line,
            "image": main_image,
            "hashtags": HASHTAGS_DROP,
        },
        {
            "day": (drop_dt + timedelta(days=2)).strftime("%Y-%m-%d"),
            "type": "lifestyle",
            "caption": f"Encore quelques pièces disponibles. 🤍\n\nLien en bio ↑",
            "image": main_image,
            "hashtags": HASHTAGS_DROP,
        },
    ]

    drops = load_drops()
    drops.append({
        "name": drop_name,
        "date": drop_date,
        "campaign": campaign,
        "created_at": datetime.now().isoformat(),
    })
    save_drops(drops)

    # Ajoute automatiquement les posts dans la file d'attente
    for i, post in enumerate(campaign):
        folder_name = f"drop_{drop_name.replace(' ', '_')}_{i}"
        add_post_to_queue(post["image"], post["caption"], post["hashtags"], folder_name)

    print(f"✅ Campagne '{drop_name}' programmée — {len(campaign)} posts créés")
    print(f"   Drop date : {drop_date}")
    for p in campaign:
        print(f"   {p['day']} → {p['type']}")

    return campaign


def check_and_post_today():
    """Vérifie si un post de campagne est prévu aujourd'hui et le publie."""
    from poster import publish_next_post
    today = datetime.now().strftime("%Y-%m-%d")

    drops = load_drops()
    for drop in drops:
        for post in drop.get("campaign", []):
            if post["day"] == today and not post.get("posted"):
                print(f"🎯 Post de campagne prévu aujourd'hui : {drop['name']}")
                publish_next_post()
                post["posted"] = True

    save_drops(drops)


if __name__ == "__main__":
    # Exemple d'utilisation
    schedule_drop_campaign(
        drop_name="Collection Été 2026",
        drop_date="2026-06-01",
        main_image="posts_queue/001/image.jpg",
        spotify_link="",
    )
