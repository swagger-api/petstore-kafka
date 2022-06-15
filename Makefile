NIX_RUN = nix-shell --run 
BASH_RUN = bash -c 

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
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

dev-kafka: ## Runs just the Kafka services (kafka, zookeeper and CMAK)
	$(RUN) "cd ./services/kafka && docker-compose up"

dev-pets: ## Runs the Pets service
	$(RUN) "cd ./services/pets && yarn run dev"

dev-adoptions: ## Runs the Adoptions service
	$(RUN) "cd ./services/adoptions && yarn run dev"

dev-websocket: ## Runs the Websocket service
	$(RUN) "cd ./services/websocket && yarn run dev"

dev-gateway: ## Runs a gateway, proxying to other services and used by web-ui
	$(RUN) "cd ./web-ui && caddy run --envfile ./dev.env"

dev-web-ui: ## Runs a creat-react-app
	$(RUN) "cd ./web-ui && yarn start"

dev:
	$(RUN) "tmuxinator start"

build-pets:
	$(RUN) "cd ./services && docker build -f Dockerfile.pets -t petstore-kafka/pets:latest ."

build-adoptions:
	$(RUN) "cd ./services && docker build -f Dockerfile.adoptions -t petstore-kafka/adoptions:latest ."

build-websocket:
	$(RUN) "cd ./services && docker build -f Dockerfile.websocket -t petstore-kafka/websocket:latest ."

build-web-ui:
	$(RUN) "cd ./web-ui && docker build -f Dockerfile -t petstore-kafka/web-ui:latest ."

build: build-pets build-adoptions build-websocket build-web-ui


.PHONY: tmuxinator
