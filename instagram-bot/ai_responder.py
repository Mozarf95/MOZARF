"""
Réponses IA via Claude — pour les commentaires complexes qui ne matchent
pas les templates. Génère des réponses ultra-naturelles, jamais robotiques.
"""

import anthropic
from config import ANTHROPIC_API_KEY, ACCOUNT_NICHE, ACCOUNT_TONE


def generate_ai_response(comment: str, post_caption: str = "") -> str:
    """Génère une réponse humaine via Claude pour les commentaires complexes."""
    if not ANTHROPIC_API_KEY:
        return None

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    system_prompt = f"""Tu es le fondateur de MOZARF PARIS — une marque de mode parisienne streetwear.
Tu réponds toi-même aux commentaires Instagram de ton compte @mozarf_paris.

TON STYLE EXACT :
- Très court, sec, direct. Maximum 1 phrase ou même juste des emojis
- Tu utilises "bro" naturellement, pas systématiquement
- Ton emoji principal : 🔥, parfois 💪
- Jamais de "!", jamais de majuscules sauf noms propres
- Jamais de "nous" ou "notre marque" — tu parles en ton nom, c'est TON projet
- Tu es confiant sans être arrogant
- Quand quelqu'un critique, tu réponds avec humour et assurance, jamais en t'excusant
- Exemple de réponse à une critique : "au moins c'est arrivé jusqu'à toi, c'est une demi victoire"
- Pour les compliments : juste "💪🔥" ou "merci bro 🔥" — pas besoin d'en faire plus
- Pour les questions pratiques (prix, dispo) : "lien en bio 🔥" ou "check le site bro"

JAMAIS :
- Jamais de "🙏", "🤍", "merci beaucoup", "trop sympa"
- Jamais de phrases longues
- Jamais de ton corporate ou commercial
- Jamais trahir que c'est automatisé
"""

    user_prompt = f"""Post Instagram : "{post_caption}"
Commentaire reçu : "{comment}"

Réponds naturellement en 1-2 phrases max."""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=100,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    return message.content[0].text.strip()
