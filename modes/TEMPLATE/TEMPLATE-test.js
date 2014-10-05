// header template: "$data_demo" is obscurely named global; "my" is the convenient local.
if (!("$data_demo" in window)) {
	$data_demo = {mode:{}};
}
(function(){
  var my = $data_demo;
  // end header template.
  
  var mode;
  if (!("TEMPLATE" in my.mode)) {
    my.mode.TEMPLATE = {};
  }
  mode = my.mode.TEMPLATE;
  
	
  mode.test = function() {
  
    test("test somethine", function() {

      deepEqual(
        "something",
        "something else"
      );

    });

  }
	
})();
