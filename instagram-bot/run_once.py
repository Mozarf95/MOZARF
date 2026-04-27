"""
Commandes manuelles pour tester le bot sans le scheduler.
Usage :
  python run_once.py post          → publie le prochain post en attente
  python run_once.py comments      → répond aux commentaires maintenant
  python run_once.py add           → ajoute un post à la file (interactif)
"""

import sys
from poster import publish_next_post, add_post_to_queue
from comment_bot import reply_to_comments


def cmd_post():
    publish_next_post()


def cmd_comments():
    reply_to_comments(max_posts=10)


def cmd_add():
    image = input("Chemin de l'image : ").strip()
    caption = input("Légende du post : ").strip()
    hashtags = input("Hashtags (optionnel, séparés par espaces) : ").strip()
    add_post_to_queue(image, caption, hashtags)


commands = {
    "post": cmd_post,
    "comments": cmd_comments,
    "add": cmd_add,
}

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else None
    if cmd not in commands:
        print(f"Usage : python run_once.py [{' | '.join(commands)}]")
        sys.exit(1)
    commands[cmd]()
