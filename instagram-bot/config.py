import os
from dotenv import load_dotenv

load_dotenv()

INSTAGRAM_USERNAME = os.getenv("INSTAGRAM_USERNAME", "mozarf_paris")
INSTAGRAM_PASSWORD = os.getenv("INSTAGRAM_PASSWORD", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ACCOUNT_NICHE = os.getenv("ACCOUNT_NICHE", "marque de mode parisienne, streetwear")
ACCOUNT_TONE = os.getenv("ACCOUNT_TONE", "cool, parisien, décontracté, authentique")

# Dossier où tu mets tes images à poster
POSTS_QUEUE_FOLDER = "posts_queue"

# Fichier log des posts déjà publiés
POSTED_LOG = "posted.json"

# Vérification des nouveaux commentaires toutes les X minutes
COMMENT_CHECK_INTERVAL_MINUTES = 10

# Délai aléatoire entre chaque réponse (secondes) pour paraître humain
REPLY_DELAY_MIN = 30
REPLY_DELAY_MAX = 180

# Heures de publication automatique (format 24h)
POST_HOURS = [9, 13, 18, 21]
