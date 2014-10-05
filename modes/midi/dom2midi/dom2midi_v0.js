(function() {

  // http://getfirebug.com/developer/api/firebug1.5/symbols/src/lite_firebugx.js.html:
  // defines stubs for console calls, if you don't actually have a console.
  if (!window.console || !console.firebug) {
     var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
     "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];
  
     window.console = {};
     for (var i = 0; i < names.length; ++i) {
       window.console[names[i]] = function() {};
     }
  }

  console.log('starting dependencies load...');

  var root = // This lets us run it from local files, localhost, or at appspot.
    "http://data-demo.appspot.com/"

  load_script( 
    "http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js",
    function() {
      load_script(
        root+"modes/midi/dom2midi/jquery.autogrow-1.0.2.1/jquery.autogrow.js",
        function() {
          load_script( 
            root+"Bytes.js",
            function() {
              load_script( 
                root+"modes/midi/midi.js",
                function() {
                  load_script(
                    root+"modes/midi/dom2midi/bookmark_maker.js",
                    function() {
                      main()
                    }
                  )
                }
              )
            }
          )
        }
      )
    }
  );



  function main() {
    console.log('starting main()');
    
    /***
     * The JS URI generated by bookmark_maker.js creates a div,
     * and attaches the parameters as a JSON blob, but
     * it's left to the code here to fill it in.
     ***/
    
    var d2m = $(".dom2midi");
    d2m.width("20em").height($(window).height()-120).css('overflow','auto');
    d2m.html('\
      <iframe src="data:,Generating%20MIDI..." height="30"></iframe>\
      <p>Click <a class="bookmark">dom2midi</a> to regenerate the MIDI\
      with the current settings,\
      or save the link to preserve these settings.</p>\
      <table>\
        <tr><td></td><td><textarea name="comment"></textarea></td></tr>\
        <tr><td>init:</td><td><textarea name="init"></textarea></td></tr>\
        <tr><td>pre:</td><td><textarea name="pre"></textarea><br/>\
        <tr><td>post:</td><td><textarea name="post"></textarea><br/>\
        <tr><td>final:</td><td><textarea name="final"></textarea><br/>\
      </table>'
    );
    d2m.find(":input").width("20em").autogrow();
    
    var params = JSON.parse(d2m.attr('params'));
    for (var param in params) {
      d2m.find(':input[name="'+param+'"]').val(params[param]);
    }
    
    function current_params() {
      // returns a hash of the current parameter values,
      // just like those in the JSON that seeded this.
      var params = {};
      d2m.find(':input').each(function() {
        var input = $(this);
        params[input.attr('name')]=input.val()
      })
      return params;
    }
    
    var set_bookmark = function() {
      d2m.find(".bookmark").attr("href",bookmark_maker(
        current_params(),
        0 /*** MUST MATCH THIS FILE'S VERSION NUMBER!!! ***/
      ));
    }
    
    set_bookmark.call();
    d2m.find(':input').change(set_bookmark);
    
    /***
     * Now that the UI is set up,
     * traverse the DOM, calling the user specified callbacks as needed.
     ***/
     
    function traverse(node, pre, post) {
      if (node.className != "dom2midi") {
        var children = node.childNodes;
        console.log('pre',node);
        pre.call(node)
        console.log('loop',node);
        for (var i=0; i<children.length; i++) {
          traverse(children[i],pre,post);
        }
        console.log('post',node);
        post.call(node)
      }
    }
    
    
    params = current_params();
    
    var music = new $data_demo.mode.midi.Music(128);
    
    // Each callback gets its own try-catch wrapper, so that if there is an
    // error, the error message can be as precise as possible.
    
    try {
      eval(params.init);
        
      // note that eval("function() {}") to dynamically create anonymous
      // functions doesn't work. That's why the assignment is inside the eval.
      try {
        eval(
          'var pre_f = function() {\
            '+params.pre+'\
          }'
        );
            
        try {
          eval(
            'var post_f = function() {\
              '+params.post+'\
            }'
          );
          
          try {
            traverse(
              document.body,
              pre_f,
              post_f
            );
            
            try {
              eval(params.final)
            } catch(e) {alert("Error in final: "+e)};
          } catch(e) {alert("Runtime error: "+e)};
        } catch(e) {alert("Syntax error in post: "+e)}
      } catch(e) {alert("Syntax error in pre: "+e)}
    } catch(e) {alert("Error in init: "+e)}
    
    d2m.find('iframe').attr('src',
      "data:audio/midi;base64,"+music.get_bytes().encode_base64()
    );
    
  } // end main()
  
  
  
  function load_script(url, callback) {
    // http://stackoverflow.com/questions/950087/include-javascript-file-inside-javascript-file
  
    console.log("loading "+url);
    var head= document.getElementsByTagName('head')[0];
    var script= document.createElement('script');
    script.type= 'text/javascript';
    script.src= url;
  
    // then bind the event to the callback function 
    // there are several events for cross browser compatibility
    script.onreadystatechange = callback;
    script.onload = callback
 
    // fire the loading
    head.appendChild(script);
  }

})()




