{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Docker
    docker
    docker-compose

    # Nodejs / web-ui
    nodejs-16_x
    yarn
    caddy

    # Optional
    tmuxinator
    tmux
    apacheKafka
    bashInteractive
  ];

}
