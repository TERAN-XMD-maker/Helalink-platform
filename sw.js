<-- PushAlert -->
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