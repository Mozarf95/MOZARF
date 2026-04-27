"""
15 familles de réponses naturelles — variées pour ne jamais paraître robot.
Chaque famille a plusieurs variantes pour éviter la répétition.
"""

import random

# 15 catégories de réponses selon le type de commentaire détecté
RESPONSE_TEMPLATES = {

    "compliment": [
        "Merci bcp 🙏",
        "Trop sympa merci !",
        "Ça fait vraiment plaisir 🤍",
        "Merci à toi 😊",
        "On est contents que ça te plaise !",
    ],

    "question_prix": [
        "Dispo sur notre site, le lien est en bio 👆",
        "Tu trouveras tout en bio 🛒",
        "Check le lien en bio pour les détails 🤍",
        "Passe sur le site via le lien en bio !",
    ],

    "question_dispo": [
        "Oui encore dispo ! Lien en bio pour commander 🔥",
        "Quelques pièces restantes, fonce avant rupture 👀",
        "Dispo sur le site, lien en bio !",
        "Stock limité — le lien est en bio 🙏",
    ],

    "feu_love": [
        "🔥🔥",
        "Merci legend 🙏",
        "On adore ton energy ❤️",
        "🤍🤍",
        "Ça motive vraiment merci 🙏",
    ],

    "collab": [
        "Slide en DM on regarde ça 👀",
        "Envoie nous un DM !",
        "On écoute tout — DM ouvert 📩",
        "DM nous avec ton projet 🤝",
    ],

    "livraison": [
        "On livre partout 🌍 Lien en bio !",
        "Livraison internationale disponible, check le site 📦",
        "Partout en Europe et au-delà — lien en bio 🚀",
    ],

    "taille": [
        "Le guide des tailles est sur le site 📐 Lien en bio",
        "Check la fiche produit sur le site pour le sizing 🙏",
        "On a un guide des tailles sur notre site, viens voir 👆",
    ],

    "tag_ami": [
        "Trop love 🤍",
        "Vos amis ont du goût 😏",
        "On vous voit 👀🔥",
        "Squad goals 🤍",
    ],

    "critique": [
        "Merci pour le retour, on prend note 🙏",
        "On entend ça, merci d'être honnête 🤍",
        "Ton avis compte vraiment, merci 🙏",
    ],

    "emoji_only": [
        "🤍",
        "🔥",
        "😊🙏",
        "❤️",
        "🫶",
    ],

    "nouveau_follower": [
        "Bienvenue dans la famille 🤍",
        "Content de t'avoir ici !",
        "Welcome 🙏🔥",
        "Bienvenue ! ❤️",
    ],

    "hype": [
        "On vous attend 🔥",
        "Drop bientôt 👀",
        "Stay tuned 🤫",
        "Ça arrive ⏳🔥",
    ],

    "humour": [
        "😂😂 trop vrai",
        "On va faire semblant de pas avoir vu ça 😅",
        "Lmaooo 😭",
        "Hahaha 🤍",
    ],

    "repost_demande": [
        "Tag-nous en story si tu portes nos pièces 🙏",
        "On adore voir vos looks ! Tag @mozarf_paris 🤍",
        "Montre-nous ton fit 📸",
    ],

    "general": [
        "Merci 🙏",
        "On apprécie 🤍",
        "🤍🔥",
        "Merci d'être là 🙏",
        "Trop sympa !",
    ],
}


def detect_category(comment: str) -> str:
    """Détecte la catégorie du commentaire pour choisir la bonne réponse."""
    c = comment.lower()

    if any(w in c for w in ["prix", "coûte", "combien", "tarif", "€", "euro"]):
        return "question_prix"
    if any(w in c for w in ["dispo", "disponible", "encore", "stock", "reste"]):
        return "question_dispo"
    if any(w in c for w in ["livraison", "livre", "livrer", "expédition", "délai", "shipping"]):
        return "livraison"
    if any(w in c for w in ["taille", "size", "xl", "xs", "xs", "s ", " m ", "l ", "xl", "fitting"]):
        return "taille"
    if any(w in c for w in ["collab", "collaboration", "partenariat", "partnership", "deal"]):
        return "collab"
    if any(w in c for w in ["🔥", "feu", "incroyable", "ouf", "🤩", "waouh", "wow", "énorme"]):
        return "feu_love"
    if any(w in c for w in ["love", "j'adore", "trop beau", "magnifique", "superbe", "parfait", "❤️", "🤍"]):
        return "compliment"
    if any(w in c for w in ["😂", "lol", "mdr", "ptdr", "haha", "💀"]):
        return "humour"
    if any(w in c for w in ["bientôt", "quand", "drop", "sortie", "release", "new", "nouveau"]):
        return "hype"
    if any(w in c for w in ["nul", "déçu", "pas bien", "mauvais", "décevant", "dommage"]):
        return "critique"
    if len(comment.strip()) <= 3:
        return "emoji_only"

    return "general"


def get_response(comment: str) -> str:
    """Retourne une réponse naturelle et aléatoire selon le commentaire."""
    category = detect_category(comment)
    options = RESPONSE_TEMPLATES[category]
    return random.choice(options)
