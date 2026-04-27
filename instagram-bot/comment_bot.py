"""
Bot de réponse automatique aux commentaires.
Vérifie les nouveaux commentaires et répond de façon naturelle.
"""

import json
import random
import time
from pathlib import Path
from datetime import datetime
from instagram_client import get_client
from responses import get_response
from ai_responder import generate_ai_response
from config import REPLY_DELAY_MIN, REPLY_DELAY_MAX, ANTHROPIC_API_KEY

REPLIED_COMMENTS_FILE = "replied_comments.json"


def load_replied() -> set:
    if not Path(REPLIED_COMMENTS_FILE).exists():
        return set()
    with open(REPLIED_COMMENTS_FILE) as f:
        return set(json.load(f))


def save_replied(replied: set):
    with open(REPLIED_COMMENTS_FILE, "w") as f:
        json.dump(list(replied), f)


def should_use_ai(comment: str) -> bool:
    """Utilise l'IA pour les commentaires longs ou complexes."""
    return ANTHROPIC_API_KEY and len(comment.split()) > 6


def reply_to_comments(max_posts: int = 5):
    """Parcourt les derniers posts et répond aux commentaires sans réponse."""
    cl = get_client()
    replied = load_replied()

    user_id = cl.user_id_from_username(cl.username)
    medias = cl.user_medias(user_id, amount=max_posts)

    new_replies = 0

    for media in medias:
        caption = media.caption_text or ""
        comments = cl.media_comments(media.pk, amount=50)

        for comment in comments:
            comment_id = str(comment.pk)

            # Skip si déjà répondu ou si c'est notre propre commentaire
            if comment_id in replied:
                continue
            if str(comment.user.pk) == str(user_id):
                continue

            comment_text = comment.text

            # Choisir la réponse
            if should_use_ai(comment_text):
                response = generate_ai_response(comment_text, caption)
                if not response:
                    response = get_response(comment_text)
            else:
                response = get_response(comment_text)

            # Délai aléatoire pour paraître humain
            delay = random.randint(REPLY_DELAY_MIN, REPLY_DELAY_MAX)
            print(f"💬 [{media.pk}] @{comment.user.username}: \"{comment_text[:40]}\"")
            print(f"   → Réponse dans {delay}s : \"{response}\"")
            time.sleep(delay)

            cl.media_comment(media.pk, f"@{comment.user.username} {response}")

            replied.add(comment_id)
            save_replied(replied)
            new_replies += 1

    print(f"✅ {new_replies} réponse(s) envoyée(s) à {datetime.now().strftime('%H:%M')}")
    return new_replies
