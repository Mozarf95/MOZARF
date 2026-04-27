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

    system_prompt = f"""Tu es le community manager du compte Instagram @mozarf_paris.
Niche du compte : {ACCOUNT_NICHE}
Ton : {ACCOUNT_TONE}

Règles ABSOLUES :
- Réponse TRÈS courte (1-2 phrases max, jamais plus)
- Jamais de majuscules au début sauf pour les noms propres
- Style SMS/réseaux sociaux, pas formel
- Utilise max 1-2 emojis
- Ne JAMAIS dire "en tant que marque" ou quoi que ce soit qui trahit un robot
- Réponds comme un humain cool de 20-25 ans parisien
- Si tu ne sais pas quoi répondre, dis juste "🤍" ou "merci 🙏"
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
