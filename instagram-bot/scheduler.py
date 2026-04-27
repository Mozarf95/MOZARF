"""
Orchestrateur principal — lance les tâches automatiquement.
Lance avec : python scheduler.py
"""

import random
import time
import logging
from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from poster import publish_next_post
from comment_bot import reply_to_comments
from config import POST_HOURS, COMMENT_CHECK_INTERVAL_MINUTES

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(message)s",
    datefmt="%H:%M:%S",
)

scheduler = BlockingScheduler(timezone="Europe/Paris")


def job_publish():
    """Publication automatique — ajoute un délai aléatoire pour éviter les patterns."""
    jitter = random.randint(0, 20 * 60)  # jusqu'à 20 min de variation
    time.sleep(jitter)
    logging.info("📸 Tentative de publication...")
    publish_next_post()


def job_comments():
    """Réponse automatique aux commentaires."""
    logging.info("💬 Vérification des commentaires...")
    reply_to_comments(max_posts=5)


# Publication automatique aux heures configurées
for hour in POST_HOURS:
    scheduler.add_job(
        job_publish,
        CronTrigger(hour=hour, minute=0, timezone="Europe/Paris"),
        id=f"post_{hour}h",
        name=f"Publication {hour}h",
    )

# Réponse aux commentaires toutes les X minutes
scheduler.add_job(
    job_comments,
    "interval",
    minutes=COMMENT_CHECK_INTERVAL_MINUTES,
    id="comment_replies",
    name=f"Réponses commentaires (/{COMMENT_CHECK_INTERVAL_MINUTES}min)",
)


if __name__ == "__main__":
    print("=" * 50)
    print("🤖 MOZARF Instagram Bot — Démarré")
    print(f"📅 Publication : {POST_HOURS}")
    print(f"💬 Commentaires : toutes les {COMMENT_CHECK_INTERVAL_MINUTES} minutes")
    print(f"🕐 Heure actuelle : {datetime.now().strftime('%H:%M')} (Paris)")
    print("=" * 50)
    print("Ctrl+C pour arrêter\n")

    try:
        scheduler.start()
    except KeyboardInterrupt:
        print("\n🛑 Bot arrêté.")
