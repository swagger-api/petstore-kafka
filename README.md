# Petstore Kafka demo site

This is a contrived demo of a petstore with adoptions.
It is build on Kafka topics written in Nodejs.

It exists as a functional example for describing with AsyncAPI.

> NOTE: Given the way Kafka rebalances and the need for cacheing, it may take a while (a few minutes) for caches to be built, depending on the size of the Topic.


## Architecture

- TODO: Add miro diagram.
- TODO: Add AsyncAPI definition(s)

- There is a browser app (SPA) written in Typescript using Create-React-APP, it's found under [[./web-ui]].
- There is a gateway for serving the SPA and proxying API calls to the other services. It is also under [[./web-ui]] and is a single Caddyfile.
- There is a Pets service (nodejs + kafka sink). [[./services/pets]]
- There is a Adoptions service (nodejs + kafka sink). [[./services/adoptions]]
- There is a Websocket service (nodejs + kafka sink + publishes events). [[./services/websocket]]
- There is a docker-compose file just for Kafka services. [[./services/kafka]].
- There is a docker-compose file for the whole stack, [[./docker-compose.yml]].

## Developing

To develop, first make sure you have all the dependencies installed.

> WARNING: Kafka needs to know its own hostname. Add an entry to your hosts file mapping kafka.local -> 127.0.0.1. Or tweak the docker-compose file to adjust.

A list can be found by running `make dependencies`. There are optional dependencie for Tmux/inator, which are helpful for spinning up several servers at once each with their own terminal pane. But that does require a little bit of tmux knowledge.

You can launch each service with `make dev-{service}` where `{service}` is the name of the service. A list can be seen by running `make help`.

Alternatively, if you have Tmuxinator install you can run `make dev` which will launch all services.

All services have hot-reload, but they make require a restart now and then if there are kafka delays/issues.

## Building

All services have a Docker image and the entire stack can be brought up with `docker-compose up` if the images are built and/or already hosted in hub.docker.com.

To build all images, run `make build` which will build them one-by-one. All builds happen within the Docker context so it isn't required to run `yarn run build` beforehand.

Alternatively you can build the indidvidual docker images with `make build-{service}` where `{service}` is the service. For a full list see `make help`.

