{ pkgs, ... }: {
  channel = "stable-24.05";

  packages = [
    pkgs.python3
  ];

  idx.previews = {
    enable = true;
    previews = {
      web = {
        command = [
          "sh"
          "-c"
          "python3 -m http.server $PORT --directory ."
        ];
        manager = "web";
      };
    };
  };
}
