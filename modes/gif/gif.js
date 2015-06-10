// header template: "$data_demo" is obscurely named global; "my" is the convenient local.
if (!("$data_demo" in window)) {
	$data_demo = {mode:{}};
}
(function(){
  var my = $data_demo;
  // end header template.
  
  var mode;
  if (!("gif" in my.mode)) {
    my.mode.gif = {};
  }
  mode = my.mode.gif;
  
  // TODO: put reusable API code here.
	
})();
