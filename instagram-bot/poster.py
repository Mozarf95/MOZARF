"""
Gestion de la file d'attente de posts et publication automatique.

Structure du dossier posts_queue/ :
  posts_queue/
    001/
      image.jpg
      caption.txt        ← texte du post (obligatoire)
      hashtags.txt       ← hashtags séparés par des espaces (optionnel)
    002/
      image.jpg
      caption.txt
"""

import json
import os
import random
from pathlib import Path
from datetime import datetime
from instagram_client import get_client
from config import POSTS_QUEUE_FOLDER, POSTED_LOG


def load_posted_log() -> set:
    if not Path(POSTED_LOG).exists():
        return set()
    with open(POSTED_LOG) as f:
        return set(json.load(f))


def save_posted_log(posted: set):
    with open(POSTED_LOG, "w") as f:
        json.dump(list(posted), f)


def get_next_post() -> dict | None:
    """Retourne le prochain post à publier depuis la file d'attente."""
    posted = load_posted_log()
    queue = Path(POSTS_QUEUE_FOLDER)

    if not queue.exists():
        queue.mkdir()
        return None

    folders = sorted([d for d in queue.iterdir() if d.is_dir()])

    for folder in folders:
        if folder.name in posted:
            continue

        image = next(
            (f for f in folder.iterdir() if f.suffix.lower() in [".jpg", ".jpeg", ".png"]),
            None,
        )
        caption_file = folder / "caption.txt"
        hashtags_file = folder / "hashtags.txt"

        if not image or not caption_file.exists():
            continue

        caption = caption_file.read_text(encoding="utf-8").strip()
        hashtags = ""
        if hashtags_file.exists():
            hashtags = "\n\n" + hashtags_file.read_text(encoding="utf-8").strip()

        return {
            "id": folder.name,
            "image": str(image),
            "caption": caption + hashtags,
        }

    return None


def publish_next_post() -> bool:
    """Publie le prochain post en attente. Retourne True si publié."""
    post = get_next_post()
    if not post:
        print("📭 Aucun post en attente dans la file d'attente")
        return False

    cl = get_client()
    print(f"📸 Publication du post : {post['id']}")

    cl.photo_upload(post["image"], post["caption"])

    posted = load_posted_log()
    posted.add(post["id"])
    save_posted_log(posted)

    print(f"✅ Post {post['id']} publié à {datetime.now().strftime('%H:%M')}")
    return True


def add_post_to_queue(image_path: str, caption: str, hashtags: str = "", folder_name: str = None):
    """Ajoute un post à la file d'attente programmatiquement."""
    queue = Path(POSTS_QUEUE_FOLDER)
    queue.mkdir(exist_ok=True)

    if not folder_name:
        existing = [d.name for d in queue.iterdir() if d.is_dir()]
        nums = [int(n) for n in existing if n.isdigit()]
        folder_name = str(max(nums) + 1).zfill(3) if nums else "001"

    post_dir = queue / folder_name
    post_dir.mkdir(exist_ok=True)

    import shutil
    shutil.copy(image_path, post_dir / Path(image_path).name)
    (post_dir / "caption.txt").write_text(caption, encoding="utf-8")
    if hashtags:
        (post_dir / "hashtags.txt").write_text(hashtags, encoding="utf-8")

    print(f"✅ Post ajouté à la file : {folder_name}")
