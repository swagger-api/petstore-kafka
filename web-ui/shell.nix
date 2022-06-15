{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs-16_x
    yarn
    caddy

    bashInteractive
  ];

  shellHook = ''
    echo Execution environment for Nodejs projects
  '';

}
