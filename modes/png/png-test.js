// header template: "$data_demo" is obscurely named global; "my" is the convenient local.
if (!("$data_demo" in window)) {
	$data_demo = {mode:{}};
}
(function(){
  var my = $data_demo;
  // end header template.
  
  if (!("png" in my.mode)) {
    my.mode.png = {};
  }
  mode = my.mode.png;
  
	
  mode.test = function() {
  
    test("chunking (CRCs)", function() {
    
      deepEqual(
        new mode.Chunk("IEND", new my.Bytes([])).array,
        [
          0, 0, 0, 0,                                         // length
          73 /* I */, 69 /* E */, 78 /* N */, 68 /* D */,     // type
                                                              // data (empty)
          174, 66, 96, 130                                    // crc
  	    ]
      );

      deepEqual(
        new mode.Chunk("IHDR", new my.Bytes([0, 0, 0, 10, 0, 0, 0, 10, 8, 6, 0, 0, 0])).array,
        [
          0, 0, 0, 13,                                       // length 
  	      73 /* I */, 72 /* H */, 68 /* D */, 82 /* R */,    // chunk type
  	      0, 0, 0, 10, 0, 0, 0, 10, 8, 6, 0, 0, 0,           // data
  	      141, 50 , 207, 189                                 // crc
  	    ]
      );

    });
    
    test("chunking (particular chunks)", function() {
    
      deepEqual(
        new mode.Chunk.IEND(),
        new mode.Chunk("IEND", new my.Bytes([]))
      )
    
      deepEqual(
        new mode.Chunk.IHDR(10,10,8,6),
        new mode.Chunk("IHDR", new my.Bytes([0, 0, 0, 10, 0, 0, 0, 10, 8, 6, 0, 0, 0]))
      );
    
      deepEqual(
        new mode.Raster(
  	      1, // bit-depth
  	      0, // grayscale
  	      [[1]] // single pixel
  	    ).encode(),
  	    [0,128]
      );
      
      deepEqual(
        new mode.Raster(
  	      1, // bit-depth
  	      0, // grayscale
  	      [[0,0,1,1,0,0,1,1,0,0]]
  	    ).encode(),
  	    [0 /*filter*/,0x33,0]
      );
      
      deepEqual(
        new mode.Raster(
  	      1, // bit-depth
  	      0, // grayscale
  	      [[1,1,0,0,1,1,0,0,1,1],[0,0,1,1,0,0,1,1,0,0]]
  	    ).encode(),
  	    [0 /*filter*/,0xCC,0xC0,
  	     0 /*filter*/,0x33,0]
      );
    });
    
    test("adler32 checksum", function() {
      // test data from http://en.wikipedia.org/wiki/Adler-32
      
      equal(
        (new mode.Raster.Zlib([87,105,107,105,112,101,100,105,97])).checksum.toString(16),
        "11e60398"
      )    
      
    });
    
    test("IDAT construction", function() {
      deepEqual(
        new mode.Chunk.IDAT(new mode.Raster(
              1, // bit depth
              0, // color_type,
              [[1,1,1,0,0,1,1,1],
               [1,0,1,1,1,1,0,1],
               [1,1,0,1,1,0,1,1],
               [0,1,1,0,0,1,1,0],
               [0,1,1,0,0,1,1,0],
               [1,1,0,1,1,0,1,1],
               [1,0,1,1,1,1,0,1],
               [1,1,1,0,0,1,1,1]]
            )),
        new mode.Chunk("IDAT",
              new my.Bytes([8, 29, 1, 16, 0, 239, 255, 0, 231, 0, 189, 0, 219, 0, 
                            102, 0, 102, 0, 219, 0, 189, 0, 231, 46, 96, 5, 203])
          )
      )
    });
    
    test("from_Raster(): B+W", function() {
      deepEqual(
        mode.from_Raster(new mode.Raster(
            1, // bit depth
            0, // PNG color type,
            [[1]]
          )).encode_base64(),
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQAAAAA3bvkkAAAADUlEQVQIHQECAP3/AIAAggCBcIj5GQAAAABJRU5ErkJggg=="
      );
      deepEqual(
        mode.from_Raster(new mode.Raster(
            1, // bit depth
            0, // PNG color type,
            [[1]]
          )).toString(),
        "89 50 4e 47 0d 0a 1a 0a  _PNG____\n" +
        "00 00 00 0d 49 48 44 52  ____IHDR\n" +
        "00 00 00 01 00 00 00 01  ________\n" +
        "01 00 00 00 00 37 6e f9  _____7n_\n" +
        "24 00 00 00 0d 49 44 41  $____IDA\n" +
        "54 08 1d 01 02 00 fd ff  T_______\n" +
        "00 80 00 82 00 81 70 88  ______p_\n" +
        "f9 19 00 00 00 00 49 45  ______IE\n" +
        "4e 44 ae 42 60 82  ND_B`_"
      );
    });
    
    test("from_Raster(): Palette", function() {
      deepEqual(
        mode.from_Raster(new mode.Raster(
            4, // bit depth 
            3, // palette color type code
            [[1]]
          ),[[255,255,255]]
        ).encode_base64(),
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABBAMAAADtO9m6AAAAA1BMVEX///+nxBvIAAAADUlEQVQIHQECAP3/ABAAEgARrJL1vQAAAABJRU5ErkJggg=="
      );
    });

    test("from_Raster(): Palette + Transparency", function() {
      deepEqual(
        mode.from_Raster(new mode.Raster(
            4, // bit depth 
            3, // palette color type code
            [[1]]
          ),[[255,255,255]],[255]
        ).encode_base64(),
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABBAMAAADtO9m6AAAAA1BMVEX///+nxBvIAAAAAXRSTlP/beQ36wAAAA1JREFUCB0BAgD9/wAQABIAEayS9b0AAAAASUVORK5CYII="
      );
    });
    
    test("from_Raster(): RGB", function() {
      deepEqual(
        mode.from_Raster(new mode.Raster_rgb(
            8, // bit depth 
            2, // RGB color type code
            [[ [255,255,255] ]]
          )
        ).encode_base64(),
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAD0lEQVQIHQEEAPv/AP///wX+Av4DfRnGAAAAAElFTkSuQmCC"
      );
    });

    test("from_Raster(): RGB + Alpha", function() {
      deepEqual(
        mode.from_Raster(new mode.Raster_rgb(
            8, // bit depth 
            6, // RGB+Alpha color type code
            [[ [255,255,255,255] ]]
          )
        ).encode_base64(),
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEElEQVQIHQEFAPr/AP////8J+wP9fSDMuAAAAABJRU5ErkJggg=="
      );
    });
    
  }
	
})();