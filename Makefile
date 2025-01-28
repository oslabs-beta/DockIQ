IMAGE?=DockIQ/docker-extension
TAG?=latest

BUILDER=buildx-multi-arch

INFO_COLOR = \033[0;36m
NO_COLOR   = \033[m

# New Node.js specific commands
install-deps: ## Install dependencies for both backend and frontend
	cd backend && npm install
	cd ui && npm install

dev-backend: ## Run backend in development mode
	cd backend && npm run dev

dev-frontend: ## Run frontend in development mode
	cd ui && npm run dev

build-deps: ## Build both backend and frontend
	cd backend && npm run build
	cd ui && npm run build

# Existing Docker Extension commands
build-extension: ## Build service image to be deployed as a desktop extension
	docker build --tag=$(IMAGE):$(TAG) .

install-extension: build-extension ## Install the extension
	docker extension install $(IMAGE):$(TAG)

update-extension: build-extension ## Update the extension
	docker extension update $(IMAGE):$(TAG)

prepare-buildx: ## Create buildx builder for multi-arch build, if not exists
	docker buildx inspect $(BUILDER) || docker buildx create --name=$(BUILDER) --driver=docker-container --driver-opt=network=host

push-extension: prepare-buildx ## Build & Upload extension image to hub. Do not push if tag already exists: make push-extension tag=0.1
	docker pull $(IMAGE):$(TAG) && echo "Failure: Tag already exists" || docker buildx build --push --builder=$(BUILDER) --platform=linux/amd64,linux/arm64 --build-arg TAG=$(TAG) --tag=$(IMAGE):$(TAG) .

help: ## Show this help
	@echo Please specify a build target. The choices are:
	@grep -E '^[0-9a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(INFO_COLOR)%-30s$(NO_COLOR) %s\n", $$1, $$2}'

.PHONY: help install-deps dev-backend dev-frontend build-deps build-extension install-extension update-extension prepare-buildx push-extension