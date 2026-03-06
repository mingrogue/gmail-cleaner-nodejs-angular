run:
	docker-compose up -d
	docker-compose logs -f

install:
	docker-compose run backend npm i
	docker-compose run service-worker npm i

stop:
	docker-compose down