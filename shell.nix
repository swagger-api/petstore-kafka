{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    docker-compose
    apacheKafka

    bashInteractive
  ];

  shellHook = ''
  '';

}
