$(function(){

  var my = $data_demo;
  
  for (var mode in my.mode) {
    if ("test" in my.mode[mode]) {
      module(mode+" mode");  
      my.mode[mode].test();
    }
    else {
      console.warn("You really ought to test "+mode);
    }
  }
  
  module("Bytes.js");
  
    my.Bytes.test();

});

  
