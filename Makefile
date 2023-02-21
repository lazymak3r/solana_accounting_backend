#!/usr/bin/make

docker_bin := $(shell command -v docker 2> /dev/null)
cwd = $(shell pwd)

.PHONY: .up
up: ## Start docker
	- $(docker_bin) compose up -d

.PHONY: .down
down: ## Stop docker
	- $(docker_bin) compose down
