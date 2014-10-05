// header template: "$data_demo" is obscurely named global; "my" is the convenient local.
if (!("$data_demo" in window)) {
	$data_demo = {mode:{}};
}
(function(){
  var my = $data_demo;
  // end header template.
  
  var mode;
  if (!("png" in my.mode)) {
    my.mode.png = {};
  }
  mode = my.mode.png;
  
  // I would have liked the CSS to be authoritative, but reading CSS from JS is flakey.
  // Instead, this data structure is used to construct the CSS, and as data for the PNG.
  mode.hex_palette = [
     [0,["00", "00", "00"]],
     [1,["FF", "FF", "FF"]],
     [2,["80", "80", "80"]],
     [3,["C0", "C0", "C0"]],
     [4,["80", "00", "00"]],
     [5,["FF", "FF", "00"]],
     [6,["FF", "00", "00"]],
     [7,["80", "80", "00"]],
     [8,["00", "80", "00"]],
     [9,["00", "FF", "FF"]],
    [10,["00", "FF", "00"]],
    [11,["00", "80", "80"]],
    [12,["00", "00", "80"]],
    [13,["FF", "00", "FF"]],
    [14,["00", "00", "FF"]],
    [15,["80", "00", "80"]]
  ];
  
  mode.draw_canvas = function() {
    // reads the column and row inputs
    // and draws a canvas of that size.
    var cols = parseInt($("#canvas_cols").val());
    var rows = parseInt($("#canvas_rows").val());
    var init_raster = (function() {
      var seed = [];
      for (i=0 ; i < rows; i++) {
        var row = [];
        for (j=0 ; j < cols; j++) {
          row.push(1); // this is the default color of the canvas.
        }
        seed.push(row);
      }
      return seed;
    }).call();
    
    var html = "<table>"
      + $.map(init_raster,function(row){
        return "<tr>"
          + $.map(row,function(val){
              return '<td color="'+val+'"/>'
            }).join("")
          + "</tr>"
      }).join("\n")
      + "</table>";
      
    $("#canvas").empty().prepend(html);
    
    // events need to be tied to new TDs.
    
    function paint(td) {
      var color = $("#palette td.selected").attr("color");
      $(td).attr("color",color);
    }
    
    $("#canvas td").mousedown(function() {
      paint(this);
      $("body").data("mousedown",true);
    });
    
    $("#canvas td").mouseenter(function() {
      if ($("body").data("mousedown")) {
        paint(this);
      }
    });
  }
	
	mode.show = function() {
      
    var palette_css = $.map(
      mode.hex_palette,
      function(i_triple){
        var i = i_triple[0];
        var rgb = "#"+i_triple[1].join("");
        return '#paint td[color="'+i+'"] {background-color:  '+rgb+'}'
      }).join("\n");
  
    $("#input").prepend('\
      <style type="text/css">\
        #paint #palette, #paint #canvas {\
          background: gray;\
          padding: 0.2em;\
          margin: 0.5em;\
          display: inline-block;\
          vertical-align: top;\
        }\
        #paint #palette td {\
          border-top: solid silver;\
          border-left: solid silver;\
          border-bottom: solid gray;\
          border-right: solid gray;\
        }\
        #paint #palette td.selected {\
          border-top: solid gray;\
          border-left: solid gray;\
          border-bottom: solid silver;\
          border-right: solid silver;\
        }\
        #paint #palette td {\
          width: 2em;\
          height: 2em;\
        }\
        #paint #canvas td {\
          width: 1em;\
          height: 1em;\
        }\
       #paint #canvas table {\
         border-spacing: 0px;\
       }\
        \
        /* these may be changed dynamically. */\
        '+palette_css+'\
      </style>\
      <div id="paint">\
        <p>If you want to minimize the length of your URI, use a smaller canvas and a smaller palette. \
        There are examples of stand-alone usage of the API for B+W, greyscale, palette,\
        and 24-bit color <a href="modes/png/png-example.html">here</a>.\
        <div id="palette">\
          <input value="16" size="2" id="canvas_cols"/>\
            &times; \
          <input value="16" size="2" id="canvas_rows"/>\
          <hr/>\
          <select>\
            <option value="1">2 color</option>\
            <option value="2">4 color</option>\
            <option value="4" selected>16 color</option>\
          </select>\
          <table>\
            <tr class="4color 2color"><td color="0" class="selected"><td color="1"></tr>\
            <tr class="4color"><td color="2"><td color="3"></tr>\
            <tr><td color="4"><td color="5"></tr>\
            <tr><td color="6"><td color="7"></tr>\
            <tr><td color="8"><td color="9"></tr>\
            <tr><td color="10"><td color="11"></tr>\
            <tr><td color="12"><td color="13"></tr>\
            <tr><td color="14"><td color="15"></tr>\
          </table>\
        </div>\
        <div id="canvas"></div>\
      </div>'
    );
    
    mode.draw_canvas()
    
    // TODO: am I sure it's safe to register these here?
    
    // choose color
    
    $("#palette td").click(function() {
      $("#palette td.selected").removeClass("selected");
      $(this).addClass("selected");
    });
    
    $("#canvas_cols, #canvas_rows").change(function() {
      // validate
      if ( $(this).val().match(/^[1-9]\d*$/) ) {
        mode.draw_canvas();
      }
      else {
        // just revert values: anything more seems gratuitous.
        $("#canvas_rows").val($("#canvas tr").length);
        $("#canvas_cols").val($("#canvas tr:eq(0) td").length);
      }
    });
    
    $("#palette select").change(function() {
      var depth = $(this).val();
      
      // resize palette
      // and remap colors
      $("#palette tr").hide();
      if (depth == "1") {
        $("#palette tr.2color").show()
        $("#canvas td").each(function(){
          var td = $(this);
          if (td.attr("color") != "1") {
            td.attr("color",0) // flatten to black
          }
        });
      }
      else if (depth == "2") {
        $("#palette tr.4color").show()
        $("#canvas td").each(function(){
          var td = $(this);
          if (! (td.attr("color") in {"1":1,"2":1,"3":1})) {
            td.attr("color",0) // flatten to black
          }
        });
      
      }
      else $("#palette tr").show();
      $("#palette td[color=0]").click(); // make sure currently selected color is one on the available.
    });
    
    var clear_mousedown = function() {
      $("body").data("mousedown",false)
    }
    
    $("body").mouseup(clear_mousedown);
    $("body").mouseleave(clear_mousedown);
    
    // redefine show for subsequent calls.
    
    mode.show = function() {
      $("#paint").add("#paint *").show(); // TODO: there must be a better idiom?
    };
    
    mode.show();
    
  }

  mode.get_uri = function() {
    return "data:image/png;base64,"+this.get_data().encode_base64();
  };

  mode.get_data = function() {
    // Reads the image data from the DOM,
    // and returns the PNG as a Bytes object.
    
    var raster_data = $("#canvas tr").map(function() {
      var raster_row = $(this).children("td").map(function() {
        return $(this).attr("color");
      });
      return [raster_row];
    });
    var width = raster_data[0].length;
    var height = raster_data.length;
    var bit_depth = parseInt($("#palette select").val());
    var color_type = 3;
    
    var raster_obj = new mode.Raster(
      bit_depth,
      color_type,
      raster_data
    );
    
    var palette = $.map(mode.hex_palette,function(pair){
      return [$.map(pair[1],function(ff){
        return parseInt(ff,16)
      })]
    });
    
    return mode.from_Raster(raster_obj, palette);
  }

	
})();