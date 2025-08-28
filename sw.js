  </style>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    header {
      background: #333;
      color: #fff;
      padding: 1em;
      text-align: center;
    }
    main {
      padding: 2em;
      text-align: center;
    }
    button {
      background: #007bff;
      color: #fff;
      padding: 0.8em 1.5em;
      border: none;
      border-radius: 5px;
      font-size: 1em;
      cursor: pointer;
    }
    button:hover {
      background: #0056b3;
    }
  </style>

  <!-- PushAlert -->
  <script type="text/javascript">
  (function(d, t) {
      var g = d.createElement(t),
          s = d.getElementsByTagName(t)[0];
      g.src = "https://cdn.pushalert.co/integrate_f8875402a4aca47d9757f70a9b7f7dd4.js";
      g.onload = function() {
          // Auto-prompt once PushAlert script is ready
          if (typeof PushAlertCo !== "undefined") {
              PushAlertCo.subscriptionPopup();
          }
      };
      s.parentNode.insertBefore(g, s);
  }(document, "script"));
  </script>
  <!-- End PushAlert -->