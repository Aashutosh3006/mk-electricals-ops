#!/usr/bin/env bash
# ==============================================================================
# MK Electricals — Operations App v2
# Automated Ubuntu Setup, GitHub + Render Cloud Deployer & Android APK Builder
# Usage:
#   chmod +x build_apk.sh
#   ./build_apk.sh [optional_path_to_mk_electricals_fullstack_rn_node_sqlite.zip]
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CRIMSON='\033[1;35m'
NC='\033[0m'

log_info()  { echo -e "${CRIMSON}[MK-OPS]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[  OK  ]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[ WARN ]${NC} $1"; }
log_err()   { echo -e "${RED}[ERROR ]${NC} $1"; }

echo "======================================================================"
echo " ⚡ MK ELECTRICALS — OPERATIONS APP v2 (UBUNTU APK & CLOUD DEPLOYER)"
echo "======================================================================"

# ------------------------------------------------------------------------------
# 1. Check & Install Ubuntu System Packages (build-essential, python3, unzip, git, curl)
# ------------------------------------------------------------------------------
log_info "Step 1/7: Checking Ubuntu build prerequisites (gcc, make, python3, unzip, git)..."
MISSING_PKGS=()
for cmd in gcc g++ make python3 unzip curl git; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    MISSING_PKGS+=("$cmd")
  fi
done

if [ ${#MISSING_PKGS[@]} -gt 0 ]; then
  log_warn "Missing tools detected (${MISSING_PKGS[*]}). Installing via apt..."
  sudo apt update
  sudo apt install -y build-essential python3 unzip curl git
else
  log_ok "All Ubuntu C/C++, Git & archive tools (build-essential, python3, unzip, git) are installed."
fi

# ------------------------------------------------------------------------------
# 2. Check Node.js (Requires Node >= 18)
# ------------------------------------------------------------------------------
log_info "Step 2/7: Verifying Node.js & npm versions..."
NEED_NODE=0
if ! command -v node >/dev/null 2>&1; then
  NEED_NODE=1
else
  NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_MAJOR" -lt 18 ]; then
    NEED_NODE=1
  fi
fi

if [ "$NEED_NODE" -eq 1 ]; then
  log_warn "Node.js 18+ not found. Installing Node.js 20 LTS via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi
log_ok "Node.js $(node -v) and npm $(npm -v) ready."

# ------------------------------------------------------------------------------
# 3. Locate or Extract mk_electricals_fullstack_rn_node_sqlite.zip
# ------------------------------------------------------------------------------
log_info "Step 3/7: Locating MK Electricals Full-Stack project workspace..."
ZIP_ARG="${1:-}"
WORK_DIR="$HOME/mk-electricals-workspace"

if [ -d "./backend" ] && [ -d "./mobile-app" ]; then
  PROJECT_ROOT="$(pwd)"
  log_ok "Found backend/ and mobile-app/ in current directory: $PROJECT_ROOT"
else
  if [ -n "$ZIP_ARG" ] && [ -f "$ZIP_ARG" ]; then
    ZIP_PATH="$ZIP_ARG"
  elif [ -f "./mk_electricals_fullstack_rn_node_sqlite.zip" ]; then
    ZIP_PATH="./mk_electricals_fullstack_rn_node_sqlite.zip"
  elif [ -f "$HOME/Downloads/mk_electricals_fullstack_rn_node_sqlite.zip" ]; then
    ZIP_PATH="$HOME/Downloads/mk_electricals_fullstack_rn_node_sqlite.zip"
  else
    log_err "Could not find mk_electricals_fullstack_rn_node_sqlite.zip in current directory or ~/Downloads."
    echo "Please pass the zip path: ./build_apk.sh /path/to/mk_electricals_fullstack_rn_node_sqlite.zip"
    exit 1
  fi

  log_info "Extracting $ZIP_PATH into $WORK_DIR ..."
  mkdir -p "$WORK_DIR"
  unzip -o "$ZIP_PATH" -d "$WORK_DIR" >/dev/null
  PROJECT_ROOT="$WORK_DIR/mk-electricals-fullstack"
  log_ok "Extracted full-stack project to: $PROJECT_ROOT"
fi

BACKEND_DIR="$PROJECT_ROOT/backend"
MOBILE_DIR="$PROJECT_ROOT/mobile-app"
API_TS_FILE="$MOBILE_DIR/src/services/api.ts"
EAS_JSON_FILE="$MOBILE_DIR/eas.json"

# ------------------------------------------------------------------------------
# 4. Optional Git Init + Push to GitHub for 1-Click Render Blueprint Deployment
# ------------------------------------------------------------------------------
log_info "Step 4/7: GitHub + Render 24/7 Cloud Sync Setup..."
echo ""
echo "======================================================================"
echo " Choose Backend Sync Mode for your APK:"
echo "   [1] Push to GitHub & Deploy 24/7 Cloud API on Render.com (PC can be OFF)"
echo "   [2] Use Local Ubuntu Wi-Fi LAN Backend (http://<Ubuntu_IP>:4000/api)"
echo "======================================================================"
read -rp "Select sync mode [1/2, default=1]: " SYNC_MODE
SYNC_MODE="${SYNC_MODE:-1}"

if [ "$SYNC_MODE" = "1" ]; then
  cd "$PROJECT_ROOT"
  cat << 'EOF' > .gitignore
node_modules/
**/node_modules/
*.db
*.db-shm
*.db-wal
*.log
.expo/
dist/
web-build/
.env
EOF

  if [ ! -d ".git" ]; then
    git init
    git branch -M main
  fi

  # Ensure git user.name and user.email are set locally if not configured globally
  if ! git config user.name >/dev/null 2>&1; then
    git config user.name "MK Electricals Admin"
  fi
  if ! git config user.email >/dev/null 2>&1; then
    git config user.email "admin@mkelectricals.local"
  fi

  git add .
  git commit -m "Initialize MK Electricals Operations v2 Full-Stack (Render Blueprint + Expo)" || true
  log_ok "Git repository initialized and committed in $PROJECT_ROOT"

  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    read -rp "Create & push to a new GitHub repo 'mk-electricals-ops' automatically via gh CLI? [Y/n]: " USE_GH
    USE_GH="${USE_GH:-Y}"
    if [[ "$USE_GH" =~ ^[Yy]$ ]]; then
      gh repo create mk-electricals-ops --public --source=. --remote=origin --push || true
      log_ok "Pushed repository to GitHub via gh CLI!"
    fi
  else
    read -rp "Paste your GitHub repository URL (e.g. https://github.com/username/mk-electricals-ops.git, or press Enter to skip push): " GH_REPO_URL
    if [ -n "$GH_REPO_URL" ]; then
      git remote remove origin >/dev/null 2>&1 || true
      git remote add origin "$GH_REPO_URL"
      git push -u origin main
      log_ok "Pushed full-stack repository to $GH_REPO_URL"
    fi
  fi

  echo ""
  log_info "Now connect your GitHub repo on https://dashboard.render.com -> 'New +' -> 'Blueprint'."
  log_info "Render will auto-detect render.yaml & backend/Dockerfile and give you a live HTTPS URL."
  read -rp "Paste your Render URL (or press Enter to keep default https://mk-electricals-ops-api.onrender.com/api): " RENDER_URL
  RENDER_URL="${RENDER_URL:-https://mk-electricals-ops-api.onrender.com/api}"
  # Ensure trailing /api
  if [[ "$RENDER_URL" != */api ]]; then
    RENDER_URL="${RENDER_URL%/}/api"
  fi

  if [ -f "$EAS_JSON_FILE" ]; then
    sed -i "s|https://mk-electricals-ops-api.onrender.com/api|${RENDER_URL}|g" "$EAS_JSON_FILE"
  fi
  if [ -f "$API_TS_FILE" ]; then
    sed -i "s|http://10.0.2.2:4000/api|${RENDER_URL}|g" "$API_TS_FILE"
    sed -i "s|http://localhost:4000/api|${RENDER_URL}|g" "$API_TS_FILE"
  fi
  log_ok "Configured APK to sync 24/7 with Cloud API: $RENDER_URL"
else
  # Mode 2: Local Ubuntu LAN Wi-Fi IP
  LAN_IP=$(hostname -I | awk '{print $1}')
  LAN_IP="${LAN_IP:-10.0.2.2}"
  if [ -f "$API_TS_FILE" ]; then
    sed -i "s|http://10.0.2.2:4000/api|http://${LAN_IP}:4000/api|g" "$API_TS_FILE"
    sed -i "s|http://localhost:4000/api|http://${LAN_IP}:4000/api|g" "$API_TS_FILE"
  fi
  log_ok "Configured APK to sync with Ubuntu LAN IP: http://${LAN_IP}:4000/api"
fi

# ------------------------------------------------------------------------------
# 5. Open Firewall (if needed) & Start Local SQLite Backend Server for Testing
# ------------------------------------------------------------------------------
log_info "Step 5/7: Installing & starting local Node.js + SQLite backend on port 4000..."
if command -v ufw >/dev/null 2>&1 && sudo ufw status | grep -q "Status: active"; then
  sudo ufw allow 4000/tcp >/dev/null || true
fi

cd "$BACKEND_DIR"
npm install

if command -v fuser >/dev/null 2>&1; then
  fuser -k 4000/tcp >/dev/null 2>&1 || true
fi

nohup npm start > "$BACKEND_DIR/server.log" 2>&1 &
BACKEND_PID=$!
sleep 2

if curl -fsS "http://localhost:4000/api/health" >/dev/null 2>&1; then
  log_ok "Local SQLite Backend API is running (PID: $BACKEND_PID)"
else
  log_warn "Backend process started (PID: $BACKEND_PID); check $BACKEND_DIR/server.log if port 4000 was in use."
fi

# ------------------------------------------------------------------------------
# 6. Install React Native Dependencies
# ------------------------------------------------------------------------------
log_info "Step 6/7: Installing React Native (Expo) dependencies in $MOBILE_DIR ..."
cd "$MOBILE_DIR"
npm install
log_ok "Mobile app dependencies installed."

# ------------------------------------------------------------------------------
# 7. Build or Preview the Android APK
# ------------------------------------------------------------------------------
echo ""
echo "======================================================================"
echo " Step 7/7: Choose how to build or launch MK Electricals Operations v2:"
echo "   [1] Cloud APK Build via Expo EAS (Recommended — outputs direct .apk link)"
echo "   [2] Local Ubuntu Gradle APK Build (Requires Android SDK & OpenJDK 17)"
echo "   [3] Launch Live Expo Go Server on LAN (Test immediately on phone)"
echo "======================================================================"
read -rp "Select option [1/2/3, default=1]: " BUILD_CHOICE
BUILD_CHOICE="${BUILD_CHOICE:-1}"

if [ "$BUILD_CHOICE" = "1" ]; then
  log_info "Checking Expo EAS authentication..."
  if ! npx eas-cli whoami >/dev/null 2>&1; then
    log_info "Please sign in to your Expo account:"
    npx eas-cli login
  fi
  log_info "Triggering Android .apk build using profile 'preview' in eas.json..."
  npx eas-cli build -p android --profile preview
elif [ "$BUILD_CHOICE" = "2" ]; then
  log_info "Checking OpenJDK 17 for local Gradle compilation..."
  if ! command -v javac >/dev/null 2>&1; then
    sudo apt install -y openjdk-17-jdk
  fi
  log_info "Generating native Android directory via expo prebuild..."
  npx expo prebuild --platform android
  cd "$MOBILE_DIR/android"
  chmod +x ./gradlew
  ./gradlew assembleRelease
  log_ok "Local APK compiled at: $MOBILE_DIR/android/app/build/outputs/apk/release/app-release.apk"
else
  log_info "Starting Expo Go development server..."
  npx expo start --lan
fi
