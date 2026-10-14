.PHONY: up down logs test lint clean

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f --tail=100

test:
	npm test

lint:
	npm run lint

clean:
	docker compose down --volumes --remove-orphans
