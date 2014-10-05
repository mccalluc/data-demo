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
  
	
  mode.show = function() {

    // TODO: initialization code.
    
    // redefine show() for subsequent calls.
    
    mode.show = function() {
      // TODO: $.show() the appropriate bits.
    };
    
    mode.show();
    
  }

  mode.get_uri = function() {
    return "data:INSERT/MIMETYPE;base64,"+this.get_data().encode_base64();
  };

  mode.get_data = function() {
    // TODO
  }

	
})();
