NIX_RUN = nix-shell --run 
BASH_RUN = bash -c 
DOCKER_ORG = ponelat

# Check if nix-shell exists, use that. Else use bash.
# Nix is a package manager that will install all the packages needed,
# else you'll need to manually ensure you have all dependencies (like docker, docker-compose, nodejs, caddy, etc)
ifneq (, $(shell which nix-shell))
RUN := $(NIX_RUN)
else
RUN := $(BASH_RUN)
endif

help: ## Prints help for targets with comments
	@grep -E '^[a-zA-Z._-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		sort | \
		awk 'BEGIN {\
				FS = ":.*?## "; \
				print "If you are lost, read the README.md.\nList of tasks.\n";\
			}; { \
		    printf "\033[36m%-30s\033[0m %s\n", $$1, $$2; \
			}'

dependencies: ## Prints list of dependencies in the project (for non-nix users)
	@grep -E '^ *[a-zA-Z._-]+ *.*?## .*$$' shell.nix | \
		sort | \
		awk 'BEGIN {FS = "## "; \
			print "List of dependencies required.\n";\
			}; { \
			split($$2, descArr, "\\(optional\\)"); \
			dep = $$1; \
			desc = $$2; \
			color = "35m"; \
			if (length(descArr) > 1) {\
			  dep = dep  " (optional)"; \
			  desc = descArr[2]; \
				color = "33m"; \
			} \
			gsub(/^[ \t]+/,"",dep); \
			gsub(/^[ \t]+/,"",desc); \
			printf "\033[%s%-30s\033[0m%s\n",color,dep,desc \
		}'

dev-kafka: ## Runs just the Kafka services (kafka, zookeeper and CMAK)
	$(RUN) "cd ./services/kafka && docker-compose up"

dev-pets: ## Runs the Pets service
	$(RUN) "cd ./services/pets && yarn && yarn run dev"

dev-adoptions: ## Runs the Adoptions service
	$(RUN) "cd ./services/adoptions && yarn &&  yarn run dev"

dev-websocket: ## Runs the Websocket service
	$(RUN) "cd ./services/websocket && yarn && yarn run dev"

dev-gateway: ## Runs a gateway, proxying to other services and used by web-ui
	$(RUN) "cd ./web-ui && caddy run --envfile ./dev.env"

dev-web-ui: ## Runs a create-react-app
	$(RUN) "cd ./web-ui && yarn && yarn start"

dev: ## Start a Tmuxinator project running all dev services
	$(RUN) "tmuxinator start"

build-pets: ## Build docker image for Pets service
	$(RUN) "cd ./services && docker build -f Dockerfile.pets -t $(DOCKER_ORG)/petstore-kafka-pets:latest ."

build-adoptions: ## Build docker image for Adoptions service
	$(RUN) "cd ./services && docker build -f Dockerfile.adoptions -t $(DOCKER_ORG)/petstore-kafka-adoptions:latest ."

build-websocket: ## Build docker image for Websocket service
	$(RUN) "cd ./services && docker build -f Dockerfile.websocket -t $(DOCKER_ORG)/petstore-kafka-websocket:latest ."

build-web-ui: ## Build docker image for SPA (includes caddy gateway)
	$(RUN) "cd ./web-ui && docker build -f Dockerfile -t $(DOCKER_ORG)/petstore-kafka-web-ui:latest ."

build: build-pets build-adoptions build-websocket build-web-ui ## Build all docker images

clean-main: ## Clean the docker volumes used in `make start`
	$(RUN) "docker-compose -f ./docker-compose.yml down -v"

clean-dev: ## Clean the docker volumes used in `make dev`
	$(RUN) "docker-compose -f ./services/kafka/docker-compose.yml down -v"

docker-push-pets: ## Push docker image for pets
	$(RUN) "docker push $(DOCKER_ORG)/petstore-kafka-pets:latest"

docker-push-adoptions: ## Push docker image for adoptions
	$(RUN) "docker push $(DOCKER_ORG)/petstore-kafka-adoptions:latest"

docker-push-websocket: ## Push docker image for websocket
	$(RUN) "docker push $(DOCKER_ORG)/petstore-kafka-websocket:latest"

docker-push-web-ui: ## Push docker image for web-ui
	$(RUN) "docker push $(DOCKER_ORG)/petstore-kafka-web-ui:latest"

docker-push: docker-push-pets docker-push-adoptions docker-push-websocket docker-push-web-ui ## Push ALL docker images

build-adoptions: ## Build docker image for Adoptions service
	$(RUN) "cd ./services && docker build -f Dockerfile.adoptions -t $(DOCKER_ORG)/petstore-kafka-adoptions:latest ."

build-websocket: ## Build docker image for Websocket service
	$(RUN) "cd ./services && docker build -f Dockerfile.websocket -t $(DOCKER_ORG)/petstore-kafka-websocket:latest ."

build-web-ui: ## Build docker image for SPA (includes caddy gateway)
	$(RUN) "cd ./web-ui && docker build -f Dockerfile -t $(DOCKER_ORG)/petstore-kafka-web-ui:latest ."

start: ## Start the entire stack via docker-compose. May require building images first with make build.
	$(RUN) "docker-compose up"
