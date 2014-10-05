function bookmark_maker(params,version) {
  // Given 
  //   params: a map of field names to values,
  //   and a version number to match the target dom2midi_v#.js,
  // returns a javascript bookmarklet URI.
  
  function escape(s) {
    return s
      .replace(/\\/g,"\\\\")
      .replace(/'/g,"\\'")
      .replace(/"/g,'\\"');
  }
  
  var root = // This lets us run it from local files, localhost, or at appspot.
    "http://data-demo.appspot.com/"
    
  var js_source = "\
    var d2m=document.getElementsByClassName('dom2midi');\
    if(d2m.length > 0)\
      document.body.removeChild(d2m[0]);\
    \
    var div=document.createElement('div');\
    div.style.color='black';\
    div.style.padding='1em';\
    div.style.position='fixed';\
    div.style.zIndex='9999';\
    div.style.border='2px solid black';\
    div.style.left='40px';\
    div.style.top='40px';\
    div.style.background='white';\
    \
    div.innerHTML='Please wait.';\
    div.setAttribute('class','dom2midi');\
    div.setAttribute('params','"+escape(JSON.stringify(params))+"');\
    document.body.appendChild(div);\
    \
    var js=document.createElement('script');\
    js.setAttribute('type','text/javascript');\
    js.setAttribute('src','"+root+"modes/midi/dom2midi/dom2midi_v"+version+".js');\
    document.body.appendChild(js);"
  
  return "javascript:(function(){"
    + encodeURIComponent(
        js_source
        .replace(/;\s+/g,";")
        .replace(/\s+/g," ")
      )
    + "})()";

}