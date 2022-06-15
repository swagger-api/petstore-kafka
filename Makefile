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

start-kafka: ## Runs just the Kafka services (kafka, zookeeper and CMAK)
	cd ./services/kafka && $(RUN) "docker-compose up"

start-pets: ## Runs the Pets service
	cd ./services/pets && $(RUN) "yarn run dev"

start-adoptions: ## Runs the Adoptions service
	cd ./services/adoptions && $(RUN) "yarn run dev"

start-websocket: ## Runs the Websocket service
	cd ./services/websocket && $(RUN) "yarn run dev"

start-gateway: ## Runs a gateway, proxying to other services and used by web-ui
	cd ./web-ui && $(RUN) "caddy run --envfile ./dev.env"

start-web-ui: ## Runs a creat-react-app
	cd ./web-ui && $(RUN) "yarn start"

dev:
	$(RUN) "tmuxinator start"

.PHONY: tmuxinator
