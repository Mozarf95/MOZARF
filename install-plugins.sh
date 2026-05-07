#!/usr/bin/env bash
# Installation des plugins Claude Code sur ta machine locale
# Usage: bash install-plugins.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Installation Plugins Claude Code     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

CLAUDE_DIR="$HOME/.claude"
SKILLS_DIR="$CLAUDE_DIR/skills"
PLUGINS_DIR="$CLAUDE_DIR/plugins"

mkdir -p "$SKILLS_DIR" "$PLUGINS_DIR"

# ─────────────────────────────────────────────
# 1. SUPERPOWERS (obra/superpowers)
# ─────────────────────────────────────────────
echo -e "${YELLOW}[1/2] Installation de obra/superpowers...${NC}"

if [ -d "$PLUGINS_DIR/superpowers" ]; then
    echo "  Mise à jour..."
    git -C "$PLUGINS_DIR/superpowers" pull --quiet
else
    git clone --depth=1 https://github.com/obra/superpowers.git "$PLUGINS_DIR/superpowers" --quiet
fi

# Copier les skills
for skill_dir in "$PLUGINS_DIR/superpowers/skills"/*/; do
    skill_name=$(basename "$skill_dir")
    cp -r "$skill_dir" "$SKILLS_DIR/"
done

chmod +x "$PLUGINS_DIR/superpowers/hooks/run-hook.cmd"
chmod +x "$PLUGINS_DIR/superpowers/hooks/session-start"

# Ajouter le hook SessionStart dans settings.json
SETTINGS="$CLAUDE_DIR/settings.json"
if [ ! -f "$SETTINGS" ]; then
    echo '{}' > "$SETTINGS"
fi

# Vérifier si le hook est déjà présent
if ! grep -q "superpowers" "$SETTINGS" 2>/dev/null; then
    python3 - <<PYEOF
import json, sys

settings_path = "$SETTINGS"
with open(settings_path) as f:
    content = f.read().strip()
    settings = json.loads(content) if content else {}

hook = {
    "type": "command",
    "command": "CLAUDE_PLUGIN_ROOT=$PLUGINS_DIR/superpowers $PLUGINS_DIR/superpowers/hooks/run-hook.cmd session-start",
    "async": False
}

hooks = settings.setdefault("hooks", {})
session_start = hooks.setdefault("SessionStart", [])

# Vérifier si déjà présent
already = any("superpowers" in str(e) for e in session_start)
if not already:
    session_start.append({
        "matcher": "startup|clear|compact",
        "hooks": [hook]
    })

with open(settings_path, "w") as f:
    json.dump(settings, f, indent=4)

print("  Hook SessionStart ajouté.")
PYEOF
else
    echo "  Hook superpowers déjà présent dans settings.json."
fi

echo -e "${GREEN}  ✓ superpowers installé (14 skills)${NC}"

# ─────────────────────────────────────────────
# 2. UI/UX PRO MAX (nextlevelbuilder)
# ─────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[2/2] Installation de ui-ux-pro-max...${NC}"

if ! command -v uipro &>/dev/null; then
    npm install -g uipro-cli --quiet
fi

# Installer dans le dossier global ~/.claude/skills/
cd "$HOME"
uipro init --ai claude --output "$SKILLS_DIR" 2>/dev/null || \
    uipro init --ai claude 2>/dev/null || true

# Fallback: installer depuis GitHub si uipro échoue
if [ ! -d "$SKILLS_DIR/ui-ux-pro-max" ]; then
    TMP=$(mktemp -d)
    git clone --depth=1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git "$TMP" --quiet
    npm install -g uipro-cli --quiet
    cd "$TMP"
    uipro init --ai claude 2>/dev/null || true
    # Copier manuellement si toujours absent
    if [ -d "$TMP/src/ui-ux-pro-max" ] && [ ! -d "$SKILLS_DIR/ui-ux-pro-max" ]; then
        cp -r "$TMP/src/ui-ux-pro-max" "$SKILLS_DIR/"
    fi
    rm -rf "$TMP"
fi

echo -e "${GREEN}  ✓ ui-ux-pro-max installé${NC}"

# ─────────────────────────────────────────────
# RÉSUMÉ
# ─────────────────────────────────────────────
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            Installation terminée         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "Skills installées dans : $SKILLS_DIR"
echo ""
ls "$SKILLS_DIR" 2>/dev/null | while read s; do echo "  ✓ $s"; done
echo ""
echo -e "${YELLOW}→ Redémarre Claude Code pour activer les skills.${NC}"
echo ""
echo -e "${YELLOW}Pour LLM Council (app web) :${NC}"
echo "  cd llm-council"
echo "  echo 'OPENROUTER_API_KEY=sk-or-v1-...' > .env"
echo "  ./start.sh"
echo ""
