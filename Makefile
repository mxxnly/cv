# On Windows (PowerShell/cmd) /bin/bash doesn't exist — use Git Bash and its coreutils
ifeq ($(OS),Windows_NT)
  export PATH := C:/Program Files/Git/usr/bin;C:/Program Files/Git/bin;$(PATH)
  SHELL := bash.exe
else
  SHELL := /bin/bash
endif
.DEFAULT_GOAL := help

COMPOSE ?= docker compose

# ========== COMPOSE FILES ==========
BASE_COMPOSE := -f docker-compose.yml
DEV_COMPOSE  := $(BASE_COMPOSE) -f docker/development.yml
# Without DOMAIN in .env the stack runs on a bare IP: images are built on the server and nginx
# listens on :80 directly (docker/production-ip.yml). With DOMAIN set: GHCR images behind
# Traefik with Let's Encrypt (docker/production.yml).
PROD_OVERRIDE := $(if $(shell grep -E '^DOMAIN=.+' .env 2>/dev/null),docker/production.yml,docker/production-ip.yml)
PROD_COMPOSE := $(BASE_COMPOSE) -f $(PROD_OVERRIDE)
PROD_HAS_DOMAIN := $(filter docker/production.yml,$(PROD_OVERRIDE))
PROD_UP_FLAGS := $(if $(PROD_HAS_DOMAIN),--no-build,--build)

ENV_FILE := .env
ENV_ARG  := --env-file $(ENV_FILE)

DEV  := $(COMPOSE) $(ENV_ARG) $(DEV_COMPOSE)
PROD := $(COMPOSE) $(ENV_ARG) $(PROD_COMPOSE)

DEV_MARKER := .images.built-dev
BACKUP_DIR := backups

CONTAINER ?= backend
REGISTRY  ?= ghcr.io/mxxnly
IMAGE_TAG ?= latest

# ========== COLORS & TAGS ==========
RESET      := \033[0m
BOLD       := \033[1m
FG_BLUE    := \033[34m
FG_CYAN    := \033[36m
FG_GREEN   := \033[32m
FG_YELLOW  := \033[33m
FG_RED     := \033[31m
FG_MAGENTA := \033[35m

TAG_GLOBAL := $(FG_MAGENTA)[GLOBAL]$(RESET)
TAG_DEV    := $(FG_BLUE)[DEV]$(RESET)
TAG_PROD   := $(FG_CYAN)[PROD]$(RESET)
TAG_ERROR  := $(FG_RED)[ERROR]$(RESET)
TAG_INIT   := $(FG_YELLOW)[INIT]$(RESET)
TAG_OK     := $(FG_GREEN)[OK]$(RESET)

.PHONY: help env check check-placeholders csp-hash test lint format \
        up down build rebuild nuke ps logs restart shell dbshell \
        migrate makemigrations createsuperuser seed \
        test-backend test-frontend lint-backend lint-frontend \
        up-prod down-prod pull-prod deploy-prod build-prod restart-prod ps-prod logs-prod \
        migrate-prod createsuperuser-prod shell-prod backup-prod restore-prod prune-prod

# ========== HELP ==========
help: ## [GLOBAL] 💡 Show all commands grouped by environment
	@printf "$(BOLD)Usage:$(RESET) make <target>\n\n"
	@printf "$(BOLD)Legend:$(RESET) [$(FG_MAGENTA)GLOBAL$(RESET)] [$(FG_BLUE)DEV$(RESET)] [$(FG_CYAN)PROD$(RESET)]\n\n"
	@for group in GLOBAL DEV PROD; do \
		case $$group in GLOBAL) color="\033[35m";; DEV) color="\033[34m";; PROD) color="\033[36m";; esac; \
		printf "$$color$$group targets:$(RESET)\n"; \
		awk -v group="[$$group]" -v color="$$color" 'BEGIN {FS=":.*## "} \
			/^[[:alnum:]_.-]+:.*## / && index($$2, group) == 1 { \
				printf "  %s%-22s\033[0m %s\n", color, $$1, substr($$2, length(group) + 2) \
			}' $(MAKEFILE_LIST); \
		printf "\n"; \
	done

# ========== .env INIT ==========
$(ENV_FILE):
	@if [ -f $(ENV_FILE).example ]; then \
		printf "$(TAG_INIT) $(ENV_FILE) not found, copying from $(ENV_FILE).example...\n"; \
		cp $(ENV_FILE).example $(ENV_FILE); \
	else \
		printf "$(TAG_ERROR) $(ENV_FILE) and $(ENV_FILE).example are missing.\n"; \
		exit 1; \
	fi

env: $(ENV_FILE) ## [GLOBAL] 🔑 Create .env from .env.example (if missing)
	@printf "$(TAG_OK) $(ENV_FILE) is ready\n"

# ========== QUALITY (inside the running DEV stack) ==========
check: lint test ## [GLOBAL] ✅ Lint + tests for backend and frontend

check-placeholders: $(ENV_FILE) ## [GLOBAL] 🧾 List placeholder fields in config/company.json (fails for production)
	@$(DEV) exec backend python manage.py check_placeholders

csp-hash: ## [GLOBAL] 🔐 Print the CSP sha256 of the inline theme script in frontend/index.html
	@python3 -c "import re,hashlib,base64;h=open('frontend/index.html').read();s=re.search(r'<script>(.*?)</script>',h,re.S).group(1);print('sha256-'+base64.b64encode(hashlib.sha256(s.encode()).digest()).decode())"

test: test-backend test-frontend ## [GLOBAL] 🧪 Run all tests

lint: lint-backend lint-frontend ## [GLOBAL] 🔎 Run all linters and type checks

format: $(ENV_FILE) ## [GLOBAL] ✨ Auto-format backend (ruff) code
	@$(DEV) exec backend ruff check --fix .
	@$(DEV) exec backend ruff format .

test-backend: $(ENV_FILE) ## [DEV] 🧪 Backend tests (pytest)
	@printf "$(TAG_DEV) 🧪 Running backend tests...\n"
	@$(DEV) exec backend pytest

test-frontend: $(ENV_FILE) ## [DEV] 🧪 Frontend tests (vitest)
	@printf "$(TAG_DEV) 🧪 Running frontend tests...\n"
	@$(DEV) exec frontend npm test

lint-backend: $(ENV_FILE) ## [DEV] 🔎 Ruff lint + format check + migrations check
	@$(DEV) exec backend ruff check .
	@$(DEV) exec backend ruff format --check .
	@$(DEV) exec backend python manage.py makemigrations --check --dry-run

lint-frontend: $(ENV_FILE) ## [DEV] 🔎 ESLint + TypeScript
	@$(DEV) exec frontend npm run lint
	@$(DEV) exec frontend npm run typecheck

# ========== DEV ==========
$(DEV_MARKER): docker-compose.yml docker/development.yml docker/Dockerfile.backend docker/Dockerfile.frontend backend/requirements.txt backend/requirements-dev.txt frontend/package-lock.json
	@printf "$(TAG_DEV) 📦 Building DEV images...\n"
	@$(DEV) build --pull
	@touch $(DEV_MARKER)

up: $(ENV_FILE) $(DEV_MARKER) ## [DEV] 🚀 Start DEV stack → http://localhost
	@printf "$(TAG_DEV) 🚀 Starting DEV environment...\n"
	@$(DEV) up -d
	@printf "$(TAG_OK) Site: http://localhost  ·  Admin: http://localhost/admin/\n"

down: $(ENV_FILE) ## [DEV] 🛑 Stop DEV stack
	@printf "$(TAG_DEV) 🛑 Stopping DEV containers...\n"
	@$(DEV) down

build: $(ENV_FILE) ## [DEV] 📦 Build DEV images
	@$(DEV) build --pull
	@touch $(DEV_MARKER)

rebuild: $(ENV_FILE) ## [DEV] 🔨 Rebuild DEV images without cache
	@printf "$(TAG_DEV) 🔨 Rebuilding DEV images...\n"
	@$(DEV) build --no-cache --pull
	@touch $(DEV_MARKER)

nuke: $(ENV_FILE) ## [DEV] 💣 Stop DEV stack and delete its volumes (database!)
	@printf "$(TAG_DEV) 💣 Nuking DEV environment...\n"
	@$(DEV) down -v --remove-orphans
	@rm -f $(DEV_MARKER)

ps: $(ENV_FILE) ## [DEV] 📋 Show running containers
	@$(DEV) ps

logs: $(ENV_FILE) ## [DEV] 📜 Tail logs (SERVICE=backend for one service)
	@$(DEV) logs -f --tail=200 $(SERVICE)

restart: $(ENV_FILE) ## [DEV] ♻️  Restart containers
	@$(DEV) restart

shell: $(ENV_FILE) ## [DEV] 🐚 Shell in a container (CONTAINER=backend|frontend|nginx)
	@$(DEV) exec $(CONTAINER) sh

dbshell: $(ENV_FILE) ## [DEV] 🗄️  psql shell
	@$(DEV) exec postgres sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

migrate: $(ENV_FILE) ## [DEV] 🗄️  Apply migrations
	@$(DEV) exec backend python manage.py migrate

makemigrations: $(ENV_FILE) ## [DEV] 📝 Create migrations
	@$(DEV) exec backend python manage.py makemigrations

createsuperuser: $(ENV_FILE) ## [DEV] 👤 Create a Django superuser
	@$(DEV) exec backend python manage.py createsuperuser

seed: $(ENV_FILE) ## [DEV] 🧾 Create example products with example prices (replaces existing, published for preview)
	@printf "$(TAG_DEV) 🧾 Seeding example products...\n"
	@$(DEV) exec backend python manage.py seed_demo --force --publish

# ========== PROD ==========
up-prod: $(ENV_FILE) ## [PROD] 🚀 Start PROD stack
	@printf "$(TAG_PROD) 🚀 Starting PROD environment ($(PROD_OVERRIDE))...\n"
	@$(PROD) up -d $(PROD_UP_FLAGS)

down-prod: $(ENV_FILE) ## [PROD] 🛑 Stop PROD stack
	@$(PROD) down

pull-prod: $(ENV_FILE) ## [PROD] 📥 Pull images from GHCR
	@printf "$(TAG_PROD) 📥 Pulling images...\n"
	@$(PROD) pull

deploy-prod: $(ENV_FILE) ## [PROD] 🚢 Deploy: pull from GHCR (domain) or build locally (bare IP); migrations run on start
	@printf "$(TAG_PROD) 🚢 Deploying ($(PROD_OVERRIDE))...\n"
	@$(if $(PROD_HAS_DOMAIN),$(MAKE) --no-print-directory pull-prod,true)
	@$(PROD) up -d $(PROD_UP_FLAGS) --remove-orphans
	@$(MAKE) --no-print-directory prune-prod
	@printf "$(TAG_OK) PROD deploy finished\n"

build-prod: ## [PROD] 🔨 Build PROD images locally (REGISTRY=…, IMAGE_TAG=…)
	@printf "$(TAG_PROD) 🔨 Building PROD images as $(REGISTRY)/mxxnly-labs-*:$(IMAGE_TAG)...\n"
	@docker build -f docker/Dockerfile.backend --target production -t $(REGISTRY)/mxxnly-labs-backend:$(IMAGE_TAG) .
	@docker build -f docker/Dockerfile.frontend --target production -t $(REGISTRY)/mxxnly-labs-frontend:$(IMAGE_TAG) .
	@docker build -f docker/Dockerfile.nginx -t $(REGISTRY)/mxxnly-labs-nginx:$(IMAGE_TAG) .

restart-prod: $(ENV_FILE) ## [PROD] ♻️  Restart containers
	@$(PROD) restart

ps-prod: $(ENV_FILE) ## [PROD] 📋 Show running containers
	@$(PROD) ps

logs-prod: $(ENV_FILE) ## [PROD] 📜 Tail logs (SERVICE=backend for one service)
	@$(PROD) logs -f --tail=200 $(SERVICE)

shell-prod: $(ENV_FILE) ## [PROD] 🐚 Shell in a container (CONTAINER=backend)
	@$(PROD) exec $(CONTAINER) sh

migrate-prod: $(ENV_FILE) ## [PROD] 🗄️  Apply migrations
	@$(PROD) exec -T backend python manage.py migrate --noinput

createsuperuser-prod: $(ENV_FILE) ## [PROD] 👤 Create a Django superuser
	@$(PROD) exec backend python manage.py createsuperuser

backup-prod: $(ENV_FILE) ## [PROD] 💾 Dump the database to backups/
	@mkdir -p $(BACKUP_DIR)
	@file="$(BACKUP_DIR)/mxxnly-labs_$$(date +%Y-%m-%d_%H-%M).sql.gz"; \
	$(PROD) exec -T postgres sh -c 'pg_dump -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"' | gzip > "$$file" && \
	printf "$(TAG_OK) Saved $$file\n"

restore-prod: $(ENV_FILE) ## [PROD] ♻️  Restore the database (FILE=backups/xxx.sql.gz)
	@if [ -z "$(FILE)" ]; then printf "$(TAG_ERROR) Usage: make restore-prod FILE=backups/xxx.sql.gz\n"; exit 1; fi
	@gunzip -c "$(FILE)" | $(PROD) exec -T postgres sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'
	@printf "$(TAG_OK) Restored from $(FILE)\n"

prune-prod: ## [PROD] 🧹 Remove dangling Docker images
	@docker image prune -f
