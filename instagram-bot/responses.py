"""
15 familles de réponses — style MOZARF.
Court, sec, bro, 🔥. Jamais trop en faire.
"""

import random

RESPONSE_TEMPLATES = {

    # Quelqu'un dit que c'est incroyable, magnifique, trop bien
    "compliment": [
        "💪🔥",
        "🔥",
        "💪",
        "merci bro 🔥",
        "🔥🔥",
        "🙏🔥",
        "💥",
        "merci 🙏",
    ],

    # Quelqu'un demande le prix
    "question_prix": [
        "lien en bio 🔥",
        "check le lien en bio bro",
        "bio 🔥",
        "tout est sur le site, lien en bio",
        "lien en bio 🙏",
    ],

    # Quelqu'un demande si c'est encore dispo
    "question_dispo": [
        "encore dispo, fonce 🔥",
        "lien en bio bro, vite",
        "stock limité — bio 🔥",
        "encore là pour l'instant 🔥",
        "fonce 🙏",
    ],

    # Commentaire fire, emojis feu, "ouf", "énorme"
    "feu_love": [
        "🔥",
        "💪🔥",
        "c'est que le début bro 🔥",
        "🔥🔥",
        "merci bro",
        "💥🔥",
        "🙏💥",
    ],

    # Demande de collab ou partenariat
    "collab": [
        "DM 🔥",
        "slide en DM bro",
        "DM ouvert",
        "envoie un DM on voit ça 🔥",
        "DM 🙏",
    ],

    # Question sur la livraison
    "livraison": [
        "on livre partout, check le site 🔥",
        "lien en bio bro, tout est là",
        "partout — bio 🔥",
    ],

    # Question sur les tailles
    "taille": [
        "guide des tailles sur le site, lien en bio",
        "check la fiche produit bro 🔥",
        "tout est sur le site, lien en bio",
    ],

    # Quelqu'un tague un ami
    "tag_ami": [
        "🔥🔥",
        "vous avez le goût bro",
        "👀🔥",
        "💪",
        "🙏🔥",
        "💥",
    ],

    # Critique, "c'est pas mon style", "pas fan"
    "critique": [
        "au moins c'est arrivé jusqu'à toi, c'est une demi victoire",
        "c'est pas pour tout le monde bro 🔥",
        "ok bro",
        "au moins tu l'as vu 🔥",
        "on fait pas pour tout le monde 🙏",
    ],

    # Commentaire d'un seul emoji ou très court
    "emoji_only": [
        "🔥",
        "💪",
        "🔥🔥",
        "💪🔥",
        "🙏",
        "💥",
        "🤲",
    ],

    # Nouveau follower ou "je viens de m'abonner"
    "nouveau_follower": [
        "welcome home bro",
        "bienvenue bro 🔥",
        "🔥",
        "bienvenue dans le mouvement",
        "💪🔥",
        "🙏 bienvenue",
        "💥",
    ],

    # "C'est pour quand", "vous sortez quoi", anticipation drop
    "hype": [
        "bientôt bro 👀",
        "ça arrive 🔥",
        "patience 👀",
        "très bientôt 🔥",
        "bientôt 🙏",
        "💥 bientôt",
    ],

    # Commentaire drôle, lol, mdr
    "humour": [
        "😭🔥",
        "lmao bro",
        "😭😭",
        "bro 😭🔥",
        "😭🙏",
    ],

    # Demande de repost ou "je veux être reposté"
    "repost_demande": [
        "tag @mozarf_paris en story bro 🔥",
        "montre le fit, on voit 👀",
        "tag-nous 🔥",
        "tag-nous 🙏",
    ],

    # Tout le reste
    "general": [
        "🔥",
        "merci bro",
        "💪🔥",
        "merci 🔥",
        "💪",
        "🙏",
        "💥",
        "merci 🙏",
    ],
}


def detect_category(comment: str) -> str:
    c = comment.lower()

    if any(w in c for w in ["prix", "coûte", "combien", "tarif", "€", "euro", "ça coûte"]):
        return "question_prix"
    if any(w in c for w in ["dispo", "disponible", "encore", "stock", "reste", "rupture"]):
        return "question_dispo"
    if any(w in c for w in ["livraison", "livre", "livrer", "expédition", "délai", "shipping", "livré"]):
        return "livraison"
    if any(w in c for w in ["taille", "size", "xl", "xs", " s ", " m ", " l ", "fitting", "grand", "petit"]):
        return "taille"
    if any(w in c for w in ["collab", "collaboration", "partenariat", "partnership", "deal", "travail"]):
        return "collab"
    if any(w in c for w in ["🔥", "feu", "incroyable", "ouf", "🤩", "waouh", "wow", "énorme", "trop fort"]):
        return "feu_love"
    if any(w in c for w in ["love", "j'adore", "trop beau", "magnifique", "superbe", "parfait", "❤️", "🤍", "beau", "belle"]):
        return "compliment"
    if any(w in c for w in ["😂", "lol", "mdr", "ptdr", "haha", "💀", "mort", "😭"]):
        return "humour"
    if any(w in c for w in ["bientôt", "quand", "drop", "sortie", "release", "new", "nouveau", "prochaine"]):
        return "hype"
    if any(w in c for w in ["nul", "déçu", "pas bien", "mauvais", "décevant", "dommage", "pas mon style", "pas fan", "bof"]):
        return "critique"
    if any(w in c for w in ["abonné", "suivi", "je follow", "je m'abonne", "nouveau follow", "viens de m'abonner", "viens de follow", "just followed", "just subscribed", "new follower"]):
        return "nouveau_follower"
    if any(w in c for w in ["repost", "reposté", "story", "tag"]):
        return "repost_demande"
    if len(comment.strip()) <= 3:
        return "emoji_only"

    return "general"


def get_response(comment: str) -> str:
    category = detect_category(comment)
    return random.choice(RESPONSE_TEMPLATES[category])
