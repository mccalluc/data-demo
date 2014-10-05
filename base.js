// header template: "$data_demo" is obscurely named global; "my" is the convenient local.
if (!("$data_demo" in window)) {
	$data_demo = {mode:{}};
}
(function(){
  var my = $data_demo;
  // end header template.
  
  // One global object.
  // In general, particular modes should rely on the explicit state of
  // UI controls in the DOM, rather than creating new objects that carry
  // state implicitly.
  
  
  my.add_controls = function(target) {
  
    // This is just static html, but by creating it in a function,
    // it can be reused in the test suite.
  
    $(target).html('\
        <div id="navigate">\
          <select>\
          </select>\
        </div>\
        <div id="output">\
          <button>get "data:"</button>\
          <a href="#" style="display: none">"data:" link</a>\
          <br/>\
          <iframe style="display: none"></iframe>\
        </div>\
        <div id="input">\
        </div>\
    ');
    for (var m in my.mode) {
      $("#navigate select").append("<option value='"+m+"'>"+m+"</option>");
  }
  };
  
  
  my.set_mode = function(mode_string) {
    $("#input *").hide();
    my.mode[mode_string].show()    
  };
  
})();
