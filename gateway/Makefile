YEAR = $(shell date +%Y)
CADDY_CLI = caddy 
CADDYFILE = Caddyfile

help: ## Prints help for targets with comments
	@grep -E '^[a-zA-Z._-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# edit: $(LEDGER_FILE) ## opens the transaction log for the year in your text editor
# 	$(EDITOR) $(LEDGER_FILE)

# $(REPORTS_DIR)/%.png: $(REPORTS_DIR)/%.balances
# 	sh scripts/plot.sh $< $(*F) > $@

run: $(CADDYFILE)
	$(CADDY_CLI) run $(CADDYFILE)

dev: $(CADDYFILE)
	$(CADDY_CLI) run -watch $(CADDYFILE)

.PHONY: run
