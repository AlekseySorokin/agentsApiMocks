# Глобальные пакеты

`npm install -g yarn`

# Сборка

## Локальная сборка и запуск сервера
`yarn install`

`npm run start`

Приложение будет доступно по http://localhost:4000

# Запуск docker

## Создание образа и запуск контейнера

`docker build -t api`

`docker run --detach --publish 4000:4000 --name api-mock  api`

## Удаление всех контейнеров  

`docker stop $(docker ps -a -q)`

`docker rm $(docker ps -a -q)`

## Удаление образа 

`docker rmi api`