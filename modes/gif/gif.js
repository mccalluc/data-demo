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
  
  mode.stub = function() {
    // Returns a fixed gif, based on http://www.matthewflickinger.com/lab/whatsinagif/bits_and_bytes.asp
    
    var header = new my.Bytes([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61
    ]);
    var logical_screen_descriptor = new my.Bytes([
      0x0A, 0x00, 0x0A, 0x00, 0x91, 0x00, 0x00
	]);
	var global_color_table = new my.Bytes([
	  0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00
	]);
	var graphics_control_extension = new my.Bytes([
	  0x21, 0xF9, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00
	]);
	var image_descriptor = new my.Bytes([
	  0x2C, 0x00, 0x00, 0x00, 0x00, 0x0A, 0x00, 0x0A, 0x00, 0x00
	])
	var image_data = new my.Bytes([
	  0x02, 0x16, 0x8C, 0x2D, 0x99, 0x87, 0x2A, 0x1C, 0xDC, 0x33, 0xA0, 0x02, 0x75, 0xEC, 0x95, 0xFA, 0xA8, 0xDE, 0x60, 0x8C, 0x04, 0x91, 0x4C, 0x01, 0x00
	])

    return header.add(logical_screen_descriptor)
                 .add(global_color_table)
                 .add(graphics_control_extension)
                 .add(image_descriptor)
                 .add(image_data)
  }
	
})();
