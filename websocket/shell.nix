{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs-16_x
    yarn

    websocat
    bashInteractive
  ];

  shellHook = ''
    echo Execution environment for Nodejs projects
  '';

}
