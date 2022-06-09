{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    docker-compose
    tmuxinator
    tmux
    apacheKafka

    bashInteractive
  ];

  shellHook = ''
  '';

}
