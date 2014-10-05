// header template: "$data_demo" is obscurely named global; "my" is the convenient local.
if (!("$data_demo" in window)) {
	$data_demo = {mode:{}};
}
(function(){
  var my = $data_demo;
  // end header template.
  
  my.Bytes = function(data, optional) {
    this.array = [];
    
    if (optional == null) {
    
      if (data instanceof Array) {
        for (var i = 0; i<data.length; i++) {
          var datum = data[i];
          if (datum != null) { // nulls and undefineds are silently skipped.
            if (typeof datum != "number") {
              throw new Error("Expected number, not "+(typeof datum))
            } else if (Math.floor(datum) != datum) {
              throw new Error("Expected integer, not "+datum)
            } else if (datum < 0 || datum > 255) {
              throw new Error("Expected integer in [0,255], not "+datum)
            }
            this.array.push(datum);
          }
        }
      }

      else if (typeof data == "string") {
        for (var i = 0; i<data.length; i++) {
          var datum = data.charCodeAt(i);
          if (datum < 0 || datum > 255) {
            throw new Error("Characters above 255 not allowed without explicit encoding: "+datum)
          }
          this.array.push(datum);
        }
      }
      
      else if (data instanceof my.Bytes) {
        this.array.push.apply(this.array,data.array);
      }
      
      else if (typeof data == "number") {
         return new my.Bytes([data])
      }
      
      else {
        throw new Error("Unexpected data type: "+data)
      }
    
    } 
    
    else { // optional is defined.
    
      // TODO: generalize when generalization is required.
      if (typeof data == "number"
          && Math.floor(data) == data
          && data >= 0
          && (optional.bytes in {4:1,2:1}) 
          // don't change this last one to bit shifts: in JS, 0x100 << 24 == 0.
          && data < Math.pow(256,optional.bytes)) {
        this.array = [
         (data & 0xFF000000) >>> 24,
         (data & 0x00FF0000) >>> 16,
         (data & 0x0000FF00) >>> 8,
         (data & 0x000000FF)
        ].slice(-optional.bytes)
      }
      
      else throw new Error("Unexpected data/optional args combination: "+data)
        
    }
    
    /*******************
      Instance methods
     *******************/
    
    this.add = function(data,optional) {
      // Takes the same arguments as the constructor,
      // but appends the new data instead, and returns the modified object.
      // (suitable for chaining.)
      this.array.push.apply(this.array,new my.Bytes(data,optional).array);
      return this;
    }
    
    this.chunk = function(n) {
      // Split the array into chunks of length n.
      // Returns an array of arrays.
      var buffer = [];
      for (var i = 0; i < this.array.length; i += n) {
        var slice = this.array.slice(i,i+n);
        buffer.push(this.array.slice(i,i+n));
      };
      return buffer;
    }
    
    this.toString = function(n) {
      // one optional argument specifies line length in bytes.
      // returns a hex dump of the Bytes object.
      var chunks = this.chunk(n || 8);
      var byte;
      var lines = [];
      var hex;
      var chr;
      for (var i = 0; i < chunks.length; i++) {
        hex = [];
        chr = [];
        for (var j = 0; j < chunks[i].length; j++) {
          byte = chunks[i][j]
          hex.push(
            ((byte < 16) ? "0" : "")
            + byte.toString(16)
          );
          chr.push(
            (byte >=32 && byte <= 126 ) ?
              String.fromCharCode(byte)
              : "_"
          );
        };
        lines.push(hex.join(" ")+"  "+chr.join(""));
      }
      return lines.join("\n");
    }
    
    this.serialize = function() {
      // returns a string whose char codes correspond to the bytes of the array.
      // TODO: get rid of this once transition is complete?
      return String.fromCharCode.apply(null,this.array)
    }
      
    this.encode_base64 = function() {
      // return the base64 encoded string.
      return my.Bytes.map(
        my.Bytes.map(
          this.chunk(3),
          function(triple){
            return [
              // base64 consists of dividing the input bytes into successive 6-bit chunks.
              (function(a,b,c) {return a >> 0x2})
                .apply(null,triple),
              (function(a,b,c) {return ((a & 0x03) << 4) | ((b & 0xF0) >> 4)})
                .apply(null,triple),
              (function(a,b,c) {return (b == undefined) ? 64 : (((b & 0x0F) << 2) | (c >> 6))})
                .apply(null,triple),
              (function(a,b,c) {return (c == undefined) ? 64 : (c & 0x3F)})
                .apply(null,triple)
              // "64" to indicate that the padding character should be used.
             ];
           }
        ),
        function(number) {
          return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(number);
        }
      ).join("");
    };
    
  }

    
    /*******************
      Static methods
     *******************/
  
  my.Bytes.map = function(elems,callback) {
    /* copy and paste of the jquery one (MIT/GPL2 licensed), 
     * for identical functionality, w/o the dependency.
     *
     * http://code.jquery.com/jquery-1.5.2.js
     *
     * Copyright 2011, John Resig
     * Dual licensed under the MIT or GPL Version 2 licenses.
     * http://jquery.org/license
     */

    var ret = [], value;

		// Go through the array, translating each of the items to their
		// new value (or values).
		for ( var i = 0, length = elems.length; i < length; i++ ) {
			value = callback( elems[ i ], i);

			if ( value != null ) {
				ret[ ret.length ] = value;
			}
		}

		// Flatten any nested arrays
		return ret.concat.apply( [], ret );
	}

    /*******************
      Tests
     *******************/
  
  my.Bytes.test = function() {
    // this assumes QUnit has been loaded, 
    // but if you don't want to run tests, it's not necessary.
    
    test("skip nulls",function(){
      var intentionally_undef;
      deepEqual(
        new my.Bytes([intentionally_undef]).array,
        []
      );
      deepEqual(
        new my.Bytes([null]).array,
        []
      )
    });
  
    test("toString()",function(){
      var b = new my.Bytes("cat").add("dog").add([0,255]);
      equal(
        b.toString(),
        "63 61 74 64 6f 67 00 ff  catdog__"
      );
      b.add(b);
      equal(
        b.toString(),
        "63 61 74 64 6f 67 00 ff  catdog__\n63 61 74 64 6f 67 00 ff  catdog__"
      );
    });
    
    test("serialize()",function(){
      deepEqual(new my.Bytes("abc").serialize(),"abc");
      deepEqual(new my.Bytes([97,98,99]).serialize(),"abc");
    });
    
    test("encode_base64()", function() {
      deepEqual(
        new my.Bytes([77,97,110]).encode_base64(),
        "TWFu"
      );
      deepEqual(
        new my.Bytes("Man").encode_base64(),
        "TWFu"
      );
      deepEqual(new my.Bytes("leasure.").encode_base64(),"bGVhc3VyZS4=");
      deepEqual(new my.Bytes("easure.").encode_base64(),"ZWFzdXJlLg==");
      deepEqual(new my.Bytes("asure.").encode_base64(),"YXN1cmUu");
      deepEqual(new my.Bytes("sure.").encode_base64(),"c3VyZS4=");
    });
    
    test("4 byte big-endian numbers", function() {
      deepEqual(
        new my.Bytes(0xff, {bytes:4}),
        new my.Bytes([0,0,0,0xff])
      );
      deepEqual(
        new my.Bytes(0xffffffff, {bytes:4}),
        new my.Bytes([0xff,0xff,0xff,0xff])
      );
      deepEqual(
        new my.Bytes(0xffff, {bytes:2}),
        new my.Bytes([0xff,0xff])
      );
      throws(function(){
        new my.Bytes(-1, {bytes:4})
      });
      throws(function(){
        new my.Bytes(0.5, {bytes:4})
      });
      throws(function(){
        new my.Bytes(0x100000000, {bytes:4})
      });
    });
    
  }
  
})()
