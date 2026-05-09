"""
15 familles de réponses — style MOZARF.
Compositeur / Producteur / DJ parisien. Bilingue FR/EN.
Basé sur ses vraies réponses.
"""

import random

RESPONSE_TEMPLATES = {

    # "ton son est incroyable", "j'adore ta musique", "trop bien"
    "compliment_musique": [
        "🔥🔥🔥",
        "🙏🔥",
        "merci beaucoup 🙏🔥",
        "thanks so much, really appreciate it 🙏",
        "🔥🙏💪",
        "🙏🙏🔥",
        "💥🔥",
        "merci 🙏",
    ],

    # "fan depuis le début", "je te suis depuis longtemps", "tu vas exploser"
    "support_fan": [
        "merci pour la confiance et le support, c'est que de la passion et du taff",
        "c'est ce genre de message qui donne envie de continuer 🙏🔥",
        "merci bro, ça touche vraiment 🙏",
        "on continue 🔥🙏",
        "le support ça compte énormément, merci 🙏💪",
    ],

    # "ce son m'a aidé", "j'écoute en boucle", "ça m'a accompagné"
    "impact_emotionnel": [
        "content de savoir que ma musique ai pu t'aider emotionnellement; c'est une satisfaction en tant que compositeur, transmettre des emotions c'est ce pour quoi je fais ca avant tout",
        "c'est pour ça que je compose 🙏 merci de l'avoir ressenti comme ça",
        "glad it hit bro 🙏🔥",
        "transmettre des émotions c'est tout ce qui compte pour moi 🙏",
        "ça c'est le plus beau compliment qu'on puisse me faire 🙏💪",
    ],

    # "où écouter ta musique ?", "t'es sur Spotify ?", "lien ?"
    "ou_ecouter": [
        "lien en bio 🔥",
        "check the bio bro 🔥",
        "tout est en bio 🙏",
        "bio 🔥",
        "Spotify / Apple Music — lien en bio 🙏",
    ],

    # demande de collab
    "collab": [
        "DM me bro",
        "slide in the DM 🔥",
        "DM 🙏",
        "envoie un DM bro",
    ],

    # critique musicale, "j'aime pas ce style"
    "critique": [
        "merci du feedback 🔥",
        "chacun ses goûts bro 🙏",
        "au moins tu l'as écouté 🔥",
        "merci du retour 🙏",
    ],

    # "c'est pour quand", "nouveau son ?", "prochain drop ?"
    "hype_drop": [
        "bientôt bro 👀🔥",
        "ça arrive 🔥",
        "very soon 👀",
        "patience 🙏",
        "stay tuned 🔥",
        "💥 bientôt",
    ],

    # nouveau follower, "je viens de m'abonner"
    "nouveau_follower": [
        "welcome home bro",
        "welcome bro 🔥",
        "bienvenue dans le mouvement 🙏",
        "glad you here bro 🔥",
        "💥🔥",
        "🙏 bienvenue",
    ],

    # quelqu'un tague un ami
    "tag_ami": [
        "🔥🔥",
        "vous avez le goût bro 🔥",
        "👀🔥",
        "💪🔥",
        "🙏🔥",
    ],

    # commentaire drôle, humour
    "humour": [
        "😭🔥",
        "lmao bro 😭",
        "bro 😭🔥",
        "😭😭",
        "😭🙏",
    ],

    # "tu m'inspires", "grâce à toi je compose"
    "inspiration": [
        "ça c'est tout ce que je veux entendre 🙏🔥",
        "keep going bro 💪🔥",
        "continue, le monde a besoin de ça 🙏",
        "la musique c'est la meilleure chose qui soit 🙏🔥",
        "🙏💪🔥",
    ],

    # "t'as bossé avec qui ?", "qui a mixé ?", "quel logiciel ?"
    "question_technique": [
        "DM me bro pour les détails 🔥",
        "on en parle en DM 🙏",
        "slide in the DM 🔥",
        "DM 🙏",
    ],

    # commentaire d'un seul emoji ou 1-2 mots
    "emoji_only": [
        "🔥",
        "🙏",
        "💪",
        "💥",
        "🔥🔥",
        "🙏🔥",
        "💪🔥",
        "🤲",
    ],

    # repost, "je veux partager"
    "repost_demande": [
        "partage librement bro 🙏🔥",
        "go bro 🔥",
        "avec plaisir 🙏",
        "spread the music 🔥",
    ],

    # tout le reste
    "general": [
        "🔥",
        "🙏",
        "merci bro 🔥",
        "💪🔥",
        "thanks bro 🙏",
        "💥",
        "🙏🔥",
        "merci 🙏",
    ],
}


def detect_category(comment: str) -> str:
    c = comment.lower()

    # Priorité haute — impact émotionnel
    if any(w in c for w in ["m'a aidé", "m'accompagne", "en boucle", "dans ma vie", "m'a touché",
                             "helped me", "on repeat", "cry", "pleuré", "émotions", "ressenti",
                             "moments difficiles", "dur", "passe un cap"]):
        return "impact_emotionnel"

    # Support fan
    if any(w in c for w in ["fan depuis", "te suis depuis", "depuis le début", "vas exploser",
                             "tu vas péter", "depuis longtemps", "been following", "since day"]):
        return "support_fan"

    # Inspiration
    if any(w in c for w in ["tu m'inspires", "grâce à toi", "j'ai commencé", "inspire",
                             "inspired me", "because of you", "thanks to you"]):
        return "inspiration"

    # Où écouter
    if any(w in c for w in ["où écouter", "ou ecouter", "t'es sur spotify", "apple music",
                             "soundcloud", "où trouver", "lien musique", "where to listen",
                             "how to listen", "streaming", "écouter ta musique"]):
        return "ou_ecouter"

    # Collab
    if any(w in c for w in ["collab", "collaboration", "projet ensemble", "travailler ensemble",
                             "work together", "feature", "feat", "deal", "partenariat"]):
        return "collab"

    # Question technique
    if any(w in c for w in ["logiciel", "daw", "fl studio", "ableton", "mix", "master",
                             "sample", "plugin", "prod", "instrumentale", "beat", "comment tu fais"]):
        return "question_technique"

    # Critique
    if any(w in c for w in ["j'aime pas", "pas fan", "pas mon style", "bof", "décevant",
                             "déçu", "nul", "don't like", "not my style", "prefer"]):
        return "critique"

    # Hype / prochain drop
    if any(w in c for w in ["bientôt", "quand", "prochain", "next", "soon", "drop",
                             "sortie", "release", "nouveau son", "new track", "new song"]):
        return "hype_drop"

    # Nouveau follower
    if any(w in c for w in ["viens de m'abonner", "je m'abonne", "je follow", "just followed",
                             "new follower", "just subscribed", "nouveau follow", "abonné"]):
        return "nouveau_follower"

    # Humour
    if any(w in c for w in ["😂", "lol", "mdr", "ptdr", "haha", "💀", "mort", "😭", "dead"]):
        return "humour"

    # Tag ami
    if "@" in c and len(c.split()) <= 4:
        return "tag_ami"

    # Repost
    if any(w in c for w in ["partager", "repost", "share", "diffuser"]):
        return "repost_demande"

    # Compliment musique
    if any(w in c for w in ["incroyable", "magnifique", "trop bien", "j'adore", "love",
                             "fire", "🔥", "ouf", "énorme", "wow", "amazing", "beautiful",
                             "fantastic", "great", "excellent", "parfait", "❤️", "🤍",
                             "masterpiece", "chef", "génie"]):
        return "compliment_musique"

    # Emoji seul
    if len(comment.strip()) <= 3:
        return "emoji_only"

    return "general"


def get_response(comment: str) -> str:
    category = detect_category(comment)
    return random.choice(RESPONSE_TEMPLATES[category])
