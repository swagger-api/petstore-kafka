FROM node:16-alpine as static-site

COPY . /build
WORKDIR /build
RUN yarn && yarn run build

FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
RUN mkdir -p /srv
COPY --from=static-site /build/build /srv/build
WORKDIR /srv
EXPOSE 4000
