"""
Rapport analytics hebdomadaire automatique.
Récupère les stats Instagram et génère un résumé clair.
Envoi par : console + fichier JSON + (optionnel) email
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from instagram_client import get_client

ANALYTICS_FILE = "analytics_history.json"


def load_history() -> list:
    if not Path(ANALYTICS_FILE).exists():
        return []
    with open(ANALYTICS_FILE) as f:
        return json.load(f)


def save_history(history: list):
    with open(ANALYTICS_FILE, "w") as f:
        json.dump(history, f, indent=2, default=str)


def get_weekly_stats() -> dict:
    """Récupère et analyse les stats de la semaine écoulée."""
    cl = get_client()
    user_id = cl.user_id_from_username(cl.username)
    user_info = cl.user_info(user_id)

    # Récupère les 20 derniers posts
    medias = cl.user_medias(user_id, amount=20)

    week_ago = datetime.now() - timedelta(days=7)

    posts_this_week = []
    all_posts_stats = []

    for media in medias:
        taken_at = media.taken_at.replace(tzinfo=None) if media.taken_at.tzinfo else media.taken_at

        likes = media.like_count or 0
        comments = media.comment_count or 0
        engagement = likes + comments

        post_data = {
            "id": str(media.pk),
            "type": str(media.media_type),
            "caption": (media.caption_text or "")[:80],
            "date": taken_at.strftime("%Y-%m-%d"),
            "likes": likes,
            "comments": comments,
            "engagement": engagement,
        }
        all_posts_stats.append(post_data)

        if taken_at >= week_ago:
            posts_this_week.append(post_data)

    # Calculs
    followers = user_info.follower_count
    following = user_info.following_count

    if posts_this_week:
        total_likes = sum(p["likes"] for p in posts_this_week)
        total_comments = sum(p["comments"] for p in posts_this_week)
        best_post = max(posts_this_week, key=lambda p: p["engagement"])
        avg_engagement = (total_likes + total_comments) / len(posts_this_week)
    else:
        total_likes = total_comments = 0
        best_post = None
        avg_engagement = 0

    # Historique pour comparaison semaine précédente
    history = load_history()
    last_week_followers = history[-1]["followers"] if history else followers

    stats = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "followers": followers,
        "following": following,
        "followers_gained": followers - last_week_followers,
        "posts_this_week": len(posts_this_week),
        "total_likes_week": total_likes,
        "total_comments_week": total_comments,
        "avg_engagement": round(avg_engagement, 1),
        "best_post": best_post,
        "all_posts": all_posts_stats[:10],
    }

    history.append(stats)
    save_history(history)

    return stats


def print_weekly_report():
    """Affiche le rapport hebdomadaire dans la console."""
    print("\n" + "=" * 55)
    print("   📊 MOZARF — RAPPORT INSTAGRAM HEBDOMADAIRE")
    print("=" * 55)

    stats = get_weekly_stats()

    arrow = "▲" if stats["followers_gained"] >= 0 else "▼"
    sign = "+" if stats["followers_gained"] >= 0 else ""

    print(f"\n👥 Followers        : {stats['followers']:,}")
    print(f"   Cette semaine   : {arrow} {sign}{stats['followers_gained']}")
    print(f"\n📸 Posts publiés    : {stats['posts_this_week']}")
    print(f"❤️  Likes totaux     : {stats['total_likes_week']}")
    print(f"💬 Commentaires     : {stats['total_comments_week']}")
    print(f"📈 Engagement moyen : {stats['avg_engagement']} / post")

    if stats["best_post"]:
        bp = stats["best_post"]
        print(f"\n🏆 Meilleur post de la semaine :")
        print(f"   Date       : {bp['date']}")
        print(f"   ❤️  Likes   : {bp['likes']}")
        print(f"   💬 Comments: {bp['comments']}")
        print(f"   Caption    : \"{bp['caption']}...\"")

    # Conseils automatiques
    print(f"\n💡 Conseils :")
    if stats["posts_this_week"] < 3:
        print("   → Publie au moins 3x par semaine pour maintenir l'algorithme")
    if stats["avg_engagement"] < 50:
        print("   → Engagement faible — mise plus sur les Reels cette semaine")
    if stats["followers_gained"] > 100:
        print("   → Excellente semaine ! Identifie ce qui a fonctionné et répète")
    if stats["followers_gained"] < 10:
        print("   → Croissance lente — teste de nouveaux formats de Reels")

    print("\n" + "=" * 55 + "\n")
    return stats


if __name__ == "__main__":
    print_weekly_report()
