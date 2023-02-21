# Accounting
# Setup
* Create .env file with infra info
* pnpm i
* docker compose up
* pnpm start -w api
* pickup insomnia.json to follow up all endpoints

### Initial start commands

`pnpm start -w api` only api starts

`pnpm start -w collector` messages keeper from kafka service

`pnpm start -w keeper` sends report to Kafka

