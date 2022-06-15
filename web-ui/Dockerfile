FROM node:16-alpine as static-site

# Install deps
RUN mkdir -p /build
WORKDIR /build
COPY package.json /build/
COPY yarn.lock /build/
RUN yarn

# Build the SPA
COPY . /build
RUN yarn run build

FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
RUN mkdir -p /srv
COPY --from=static-site /build/build /srv/build
WORKDIR /srv
ENV CADDY_PORT=80
EXPOSE 80
