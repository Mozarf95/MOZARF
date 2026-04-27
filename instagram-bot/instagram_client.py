"""
Gestion de la connexion Instagram et des actions de base.
"""

import json
import os
from pathlib import Path
from instagrapi import Client
from instagrapi.exceptions import LoginRequired, TwoFactorRequired
from config import INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD

SESSION_FILE = "session.json"


def get_client() -> Client:
    """Retourne un client Instagram connecté (avec session sauvegardée)."""
    cl = Client()
    cl.delay_range = [2, 5]  # délai humain entre les requêtes

    if Path(SESSION_FILE).exists():
        try:
            cl.load_settings(SESSION_FILE)
            cl.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)
            cl.dump_settings(SESSION_FILE)
            print("✅ Connecté via session sauvegardée")
            return cl
        except LoginRequired:
            print("⚠️  Session expirée, reconnexion...")

    try:
        cl.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)
        cl.dump_settings(SESSION_FILE)
        print("✅ Connecté et session sauvegardée")
    except TwoFactorRequired:
        code = input("📱 Code 2FA reçu par SMS : ")
        cl.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD, verification_code=code)
        cl.dump_settings(SESSION_FILE)
        print("✅ Connecté avec 2FA")

    return cl
