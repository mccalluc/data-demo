// header template: "$data_demo" is obscurely named global; "my" is the convenient local.
if (!("$data_demo" in window)) {
	$data_demo = {mode:{}};
}
(function(){
  var my = $data_demo;
  // end header template.
  
  var mode;
  if (!("html" in my.mode)) {
    my.mode.html = {};
  }
  mode = my.mode.html;
	
	mode.show = function() {
	
    if (! $("#input > textarea").length) {
      $("#input").prepend('<textarea cols="40" rows="8" class="sets_width"></textarea>')
    };
    $("#input > textarea").before(
      "<p class='html'>This is html.</p><br class='html'>"
    );
    
    
    // redefine show for subsequent calls.
    
    mode.show = function() {
      $("#input *.html").show();
      $("#input > textarea").show();
    };
    
    mode.show();
  };



	mode.get_uri = function() {
    var escape = function(char) {
      if (char == "<") {return "&lt;"}
      else
      if (char == ">") {return "&gt;"}
      else
      if (char == "&") {return "&amp;"}
      else
      if (char == "\n" || char == "\r") {return "<br>"};
    };
    var html_escaped = $("#input > textarea").val().replace(/[<>&\n\r]/g,escape);
    
    return "data:text/html;charset=utf-8,"
    + "<html><body>" 
    + encodeURIComponent(html_escaped) 
    + "</body></html>"
  };
  
  mode.test = function() {
  
    test("basic", function() {
      my.add_controls("#qunit-fixture");
      my.mode.html.show();
      $("#input > textarea").val("<test>\n& 123");
      equal(
        my.mode.html.get_uri(),
        "data:text/html;charset=utf-8,<html><body>%26lt%3Btest%26gt%3B%3Cbr%3E%26amp%3B%20123</body></html>"
      )
    });

  };

})();