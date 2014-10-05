// header template: "$data_demo" is obscurely named global; "my" is the convenient local.
if (!("$data_demo" in window)) {
	$data_demo = {mode:{}};
}
(function(){
  var my = $data_demo;
  // end header template.
  
  var mode;
  if (!("text" in my.mode)) {
    my.mode.text = {};
  }
  mode = my.mode.text;

	
	mode.show = function() {

    if (! $("#input > textarea").length) {
      $("#input").prepend('<textarea cols="40" rows="8" class="sets_width"></textarea>')
    }
    $("#input > textarea").before(
      "<p class='plain_text'>This is plain text.</p><br class='plain_text'>"
    );
    
    
    // redefine show for subsequent calls.

    mode.show = function() {
      $("#input *.plain_text").show();
      $("#input > textarea").show();
    }

    mode.show();
  }


  mode.get_uri = function() {
    return "data:," 
    +  encodeURIComponent($("#input > textarea").val())
  };
  
  mode.test = function() {

    test("basic", function() {
      my.add_controls("#qunit-fixture");
      my.mode.text.show();
      $("#input > textarea").val("testing 123");
      equal(
        my.mode.text.get_uri(),
        "data:,testing%20123"
      )
    });

  }

})()