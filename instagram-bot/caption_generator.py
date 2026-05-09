"""
Génère automatiquement des captions Instagram dans le style MOZARF
via Claude — jamais deux fois le même texte.
"""

import anthropic
from config import ANTHROPIC_API_KEY, ACCOUNT_NICHE, ACCOUNT_TONE

MOZARF_STYLE_EXAMPLES = [
    "Le détail fait tout. 🤍\n\nLien en bio.",
    "Paris dans chaque couture.\n\nDispo sur le site ↑",
    "Ce qu'on porte dit ce qu'on est.\n\n#mozarf",
    "Nouvelle pièce. Même vision. 🖤",
    "Drop silencieux. Résultats bruyants.",
]


def generate_caption(
    post_type: str = "new_drop",
    product_name: str = "",
    extra_context: str = "",
) -> str:
    """
    Génère une caption Instagram dans le style MOZARF.

    post_type: 'new_drop' | 'teaser' | 'lifestyle' | 'collab' | 'repost'
    """
    if not ANTHROPIC_API_KEY:
        return _fallback_caption(post_type)

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    examples_text = "\n".join(f'- "{e}"' for e in MOZARF_STYLE_EXAMPLES)

    system = f"""Tu es le copywriter d'une marque de mode parisienne : MOZARF PARIS.
Niche : {ACCOUNT_NICHE}
Ton : {ACCOUNT_TONE}

Exemples de captions MOZARF :
{examples_text}

Règles ABSOLUES :
- Maximum 3 lignes
- Jamais de phrases longues ou compliquées
- Pas de hashtags dans la caption (ils sont ajoutés séparément)
- Toujours finir par "Lien en bio." ou "Dispo sur le site ↑" ou similaire
- Style minimaliste, parisien, confiant
- 1 emoji max, bien placé
- Jamais de points d'exclamation multiples
"""

    type_instructions = {
        "new_drop": "Nouvelle pièce / nouvelle collection qui vient de sortir.",
        "teaser": "Teaser mystérieux avant un drop. Ne révèle pas trop.",
        "lifestyle": "Photo lifestyle / lookbook. Met en valeur l'esthétique.",
        "collab": "Collaboration avec un autre artiste ou marque.",
        "repost": "Repost d'un client qui porte MOZARF.",
    }

    instruction = type_instructions.get(post_type, type_instructions["new_drop"])
    product_line = f"Produit : {product_name}" if product_name else ""
    context_line = f"Contexte : {extra_context}" if extra_context else ""

    prompt = f"""{instruction}
{product_line}
{context_line}

Écris une caption courte dans le style MOZARF."""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=150,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )

    return message.content[0].text.strip()


def _fallback_caption(post_type: str) -> str:
    import random
    fallbacks = {
        "new_drop": ["Nouvelle pièce disponible. 🤍\n\nLien en bio.", "Le drop est là.\n\nDispo sur le site ↑"],
        "teaser": ["Quelque chose arrive. 👀", "Bientôt. ⏳"],
        "lifestyle": ["Paris dans chaque détail.\n\nLien en bio.", "Ce qu'on porte dit ce qu'on est."],
        "collab": ["Deux visions. Une pièce.\n\nLien en bio.", "Collab exclusive. Dispo sur le site ↑"],
        "repost": ["La famille MOZARF. 🤍\n\nTag-nous pour être reposté.", "Vous portez MOZARF mieux que personne. 🤍"],
    }
    return random.choice(fallbacks.get(post_type, fallbacks["new_drop"]))


if __name__ == "__main__":
    for t in ["new_drop", "teaser", "lifestyle", "collab"]:
        print(f"\n[{t}]")
        print(generate_caption(t))
