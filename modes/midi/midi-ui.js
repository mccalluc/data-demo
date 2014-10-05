// header template: "$data_demo" is obscurely named global; "my" is the convenient local.
if (!("$data_demo" in window)) {
	$data_demo = {mode:{}};
}
(function(){
  var my = $data_demo;
  // end header template.
  
  var mode;
  if (!("midi" in my.mode)) {
    my.mode.midi = {};
  }
  mode = my.mode.midi;
  
    mode.draw_chart = function() {
    // draws a music chart.
    // TODO: parameterize.
    var cols = 32;
    var rows = 13;
    var init_raster = (function() {
      var seed = [];
      for (i=0 ; i < rows; i++) {
        var row = [];
        for (j=0 ; j < cols; j++) {
          row.push(""); // blank is the default instrument
        }
        seed.push(row);
      }
      return seed;
    }).call();
    
    var html = "<table>"
      + $.map(init_raster,function(row){
        return "<tr>"
          + $.map(row,function(val){
              return '<td instrument="'+val+'"/>'
            }).join("")
          + "</tr>"
      }).join("\n")
      + "</table>";
      
    $("#midi-chart").empty().prepend(html);
    
    // events need to be tied to new TDs.
    
    function note(td) {
      var instrument = $("#midi-tools td.selected").attr("instrument");
      $(td).attr("instrument",instrument);
    }
    
    $("#midi-chart td").mousedown(function() {
      note(this);
      $("body").data("mousedown",true);
    });
    
    $("#midi-chart td").mouseenter(function() {
      if ($("body").data("mousedown")) {
        note(this);
      }
    });
  }
	
  mode.show = function() {
  
    function select_instrument_html(name) {
      // given a value for the name attribute,
      // produces the html for select controlers listing all the midi instruments.
      var instruments = (function(){
        var list =[];
        for (i in mode.instrument) {
          list.push(i)
        };
        return list
      })();
      return '<select name="'+name+'">'
         + my.Bytes.map(
           instruments,
           function(instrument) {
             return '<option value="'+mode.instrument[instrument]+'">'
               +instrument.toLowerCase().replace(/_/g," ")
               +'</option>'
           }).join("\n")
         + '</select>';
    }
    
    var instrument_codes = ['a','b','c','d','e']; // arbitrary, internal-only.
    
    function all_instrument_css(codes) {
      // given a list of codes, ie ['a','b','c'...],
      // generates the appropriate css.
      function hex(n) {
        var s = Math.floor(n).toString(16);
        if (s.length == 1) {s = '0'+s}
        return s
      }
      var theta,r,g,b,rgb;
      var css = '#midi td[instrument=""] {background-color:  white;}\n';
      for (var i = 0; i < codes.length; i++) {
        console.log(codes[i]);
        theta = i*2*Math.PI/(codes.length);
        r = hex( (Math.sin(theta)+1)*127 );
        g = hex( (Math.sin(theta+2*Math.PI/3)+1)*127 );
        b = hex( (Math.sin(theta-2*Math.PI/3)+1)*127 );
        
        rgb = "#"+r+g+b;
        css += '#midi td[instrument="'+codes[i]+'"] {background-color:  '+rgb+';}\n'
      }
      return css;
    }
    
    function all_instrument_html(codes) {
      // given a list of codes, ie ['a','b','c'...],
      // generates the html for the toolbox.
      return $(codes).map(function(){
        return '<tr><td>'+select_instrument_html(this)+'</td>'+
              '<td instrument="'+this+'" class="button"></td>'+
              '<td><button name="'+this+'">clear</button></tr>'
      }).get().join('');
    }

    $("#input").prepend('\
      <style type="text/css">\
        #midi-tools, #midi-chart {\
          background: gray;\
          padding: 0.2em;\
          margin: 0.5em;\
          display: inline-block;\
          vertical-align: top;\
        }\
        #midi-tools td.button {\
          border-top: solid silver;\
          border-left: solid silver;\
          border-bottom: solid gray;\
          border-right: solid gray;\
        }\
        #midi-tools td.selected {\
          border-top: solid gray;\
          border-left: solid gray;\
          border-bottom: solid silver;\
          border-right: solid silver;\
        }\
        #midi-tools td {\
          width: 2em;\
          height: 2em;\
        }\
        '+all_instrument_css(instrument_codes)+'\
        #midi-chart td {\
          width: 1em;\
          height: 1em;\
        }\
       #midi-chart table {\
         border-spacing: 0px;\
       }\
        \
      </style>\
      <div id="midi">\
        <p>Unfortunately, this only seems to work in Firefox. IE has the usual problems,\
        but Chrome, for some reason,\
        can recognize that this is a midi file, but can not play it.</p>\
        <p><a href="modes/midi/midi-example.html">Here</a> is a simple\
        stand-alone example for using the API, and\
        <a href="modes/midi/dom2midi/dom2midi.html">here</a> is a not-so-simple\ example: a bookmarklet which generates midi from a DOM structure.</p>\
        <div id="midi-tools">\
          <table>\
            <tr>\
              <td>erase</td>\
              <td instrument="" class="button"></td>\
            </tr>\
            '+all_instrument_html(instrument_codes)+'\
          </table>\
        </div>\
        <div id="midi-chart"></div>\
      </div>'
    );
    
    mode.draw_chart();
    
    $("#midi-tools td.button").click(function() {
      $("#midi-tools td.selected").removeClass("selected");
      $(this).addClass("selected");
    });
    
    $("#midi-tools button").click(function() {
      var instrument = $(this).attr('name');
      $("#midi-chart td[instrument='"+instrument+"']").attr('instrument','')
    });
    
    $("#midi-tools select").change(function() {
      $(this).parent().parent().find('.button').click();
    });

    var clear_mousedown = function() {
      $("body").data("mousedown",false)
    }
    
    $("body").mouseup(clear_mousedown);
    $("body").mouseleave(clear_mousedown);
    
    $("#midi-tools .button").eq(1).click(); // turn on the first one in the palette.
    
    // redefine show() for subsequent calls.
    
    mode.show = function() {
      $("#midi").add("#midi *").show(); // TODO: there must be a better idiom?
    };
    
    mode.show();
    
  }

  mode.get_uri = function() {
    return "data:audio/midi;base64,"+this.get_data().encode_base64();
  };
  


  mode.get_data = function() {
  
    var music = new mode.Music(128);
    var mult = 64;
    // together, these determine the speed.
    
    var pitch_transform = function(row) {
      return 100-row
    }
    
    var instrument_map = {};
    $(
      $("#midi-tools *.button[instrument!='']").map(
        function(){ // get all the values of the instrument attribute.
          return $(this).attr("instrument")
        }
      )
    ).each(function(i){
      instrument_map[this]=parseInt($("#midi-tools select[name='"+this+"']").val());
    });
    
    var chart_data = $("#midi-chart tr").map(function() {
      var chart_row = $(this).children("td").map(function() {
        return $(this).attr("instrument");
      });
      return [chart_row];
    });
    
    function find_stop(chart_row,col) {
      // given a row array and a postion in that row,
      // returns the position where the note stops.
      var instrument = chart_row[col];
      if (chart_row.length == col+1) {
        return col+1;
      }
      for (var i=col+1; i<chart_row.length; i++) {
        if (chart_row[i] != instrument) {
          return i;
        }
      }
      return i;
    }
    
    for (var row = 0; row < chart_data.length; row++) {
      for (var col = 0; col < chart_data[row].length; col++) {
        if (chart_data[row][col] != "" &&
             (col==0 || chart_data[row][col] != chart_data[row][col-1]) // note start
           )
        {
          music.add_note({
            'start': col*mult,
            'stop': find_stop(chart_data[row],col)*mult,
            'pitch': pitch_transform(row),
            'instrument': instrument_map[chart_data[row][col]]
          })
        }
      }
    }

    return music.get_bytes();
  
  }

	
})();
