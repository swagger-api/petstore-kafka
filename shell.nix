{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    docker ## https://docs.docker.com/get-docker/
    docker-compose ## https://docs.docker.com/compose/install/

    # Nodejs / web-ui
    nodejs-16_x ## https://nodejs.org/en/download/
    yarn ## https://yarnpkg.com/getting-started/install
    caddy ## https://caddyserver.com/docs/install

    # Optional for dev
    tmuxinator ## (optional) https://github.com/tmuxinator/tmuxinator
    tmux ## (optional) https://github.com/tmux/tmux/wiki/Installing
    apacheKafka ## (optional) https://kafka.apache.org/downloads
  ];

}
