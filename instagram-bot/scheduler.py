"""
Orchestrateur principal — lance toutes les tâches automatiquement.
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
from analytics import print_weekly_report
from spotify_promoter import auto_promote_new_releases
from config import POST_HOURS, COMMENT_CHECK_INTERVAL_MINUTES

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(message)s",
    datefmt="%H:%M:%S",
)

scheduler = BlockingScheduler(timezone="Europe/Paris")


def job_publish():
    """Publication automatique avec jitter aléatoire pour paraître humain."""
    jitter = random.randint(0, 20 * 60)
    time.sleep(jitter)
    logging.info("📸 Tentative de publication...")
    publish_next_post()


def job_comments():
    """Réponse automatique aux commentaires."""
    logging.info("💬 Vérification des commentaires...")
    reply_to_comments(max_posts=5)


def job_weekly_report():
    """Rapport analytics hebdomadaire — chaque lundi à 9h."""
    logging.info("📊 Génération du rapport hebdomadaire...")
    print_weekly_report()


def job_spotify_check():
    """Vérifie les nouveaux sons Spotify et lance la promo — chaque jour à 10h."""
    logging.info("🎵 Vérification des nouveaux sons Spotify...")
    auto_promote_new_releases()


# ── Publications automatiques ──────────────────────────────────────────────
for hour in POST_HOURS:
    scheduler.add_job(
        job_publish,
        CronTrigger(hour=hour, minute=0, timezone="Europe/Paris"),
        id=f"post_{hour}h",
        name=f"Publication {hour}h",
    )

# ── Réponses commentaires toutes les X minutes ─────────────────────────────
scheduler.add_job(
    job_comments,
    "interval",
    minutes=COMMENT_CHECK_INTERVAL_MINUTES,
    id="comment_replies",
    name=f"Réponses commentaires (/{COMMENT_CHECK_INTERVAL_MINUTES}min)",
)

# ── Rapport hebdomadaire — lundi 9h ───────────────────────────────────────
scheduler.add_job(
    job_weekly_report,
    CronTrigger(day_of_week="mon", hour=9, minute=0, timezone="Europe/Paris"),
    id="weekly_report",
    name="Rapport hebdomadaire",
)

# ── Check Spotify nouveaux sons — chaque jour à 10h ───────────────────────
scheduler.add_job(
    job_spotify_check,
    CronTrigger(hour=10, minute=0, timezone="Europe/Paris"),
    id="spotify_check",
    name="Vérification Spotify",
)


if __name__ == "__main__":
    print("=" * 55)
    print("   🤖 MOZARF Instagram Bot — SYSTÈME COMPLET")
    print("=" * 55)
    print(f"📸 Publications    : {POST_HOURS}h (heure Paris)")
    print(f"💬 Commentaires    : toutes les {COMMENT_CHECK_INTERVAL_MINUTES} min")
    print(f"📊 Rapport         : chaque lundi à 9h")
    print(f"🎵 Spotify check   : chaque jour à 10h")
    print(f"🕐 Heure actuelle  : {datetime.now().strftime('%H:%M')} (Paris)")
    print("=" * 55)
    print("Ctrl+C pour arrêter\n")

    try:
        scheduler.start()
    except KeyboardInterrupt:
        print("\n🛑 Bot arrêté.")
