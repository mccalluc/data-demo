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
  
	
  mode.test = function() {
  
    test("variable length encoding", function() {

      deepEqual(
        mode.encode_number(0x00).array,
        new my.Bytes([0x00]).array
      );

      deepEqual(
        mode.encode_number(0x7F).array,
        new my.Bytes([0x7F]).array
      );

      deepEqual(
        mode.encode_number(0xFF).array,
        new my.Bytes([0x81,0x7F]).array
      );
      
      deepEqual(
        mode.encode_number(0x8000).array,
        new my.Bytes([0x82,0x80,0x00]).array
      );
      
      deepEqual(
        mode.encode_number(0x0FffFFff).array,
        new my.Bytes([0xFF,0xFF,0xFF,0x7F]).array
      );
      
    });
    
    test("Track assembly", function() {

      deepEqual(
        new mode.Track(0,mode.instrument.VIOLIN).get_bytes().array,
        [ 77,84,114,107,0,0,0,7,0,192,40,0,255,47,0 ]
      );
      
      deepEqual(
        new mode.Track(0,mode.instrument.VIOLIN)
        .add_note_on(0,0x3C,0x28)
        .add_note_off(128,0x3C)
        .get_bytes().array,
        [
        0x4d, 0x54, 0x72, 0x6b,
        0x00, 0x00, 0x00, 16, // length
        0x00, // delta time
        0xC0, 40, // prog change violin
        0x00, 			// Delta time for next message (0 = no wait)
        0x90, 0x3c, 0x28, 		// Note-On Message (middle C4)
        0x81, 0x00, 			// Delta time	(128 ticks = quarter note)
        0x90, 0x3c, 0x00, 		// Note-Off Message (C4)
        0x00, 			// Delta time
        0xff, 0x2f, 0x00 ]           // TODO: is this actually correct?
      );
      
    });
    
    test("Multiple instruments", function() {
      var header = new my.Bytes("MThd")
        .add(6,{bytes:4})    // The size in bytes of the rest of the Header chunk.
        .add(1,{bytes:2})    // Type-1 MIDI file: there can be multiple tracks in the file.
        .add(2,{bytes:2})    // Number of tracks
        .add(128,{bytes:2}); // The number of ticks per quarter note (128)
        
      var track_0 = new mode.Track(0,mode.instrument.ACOUSTIC_GRAND_PIANO)
        .add_note_on(0,0x3C,0x28)
        .add_note_off(512,0x3C)
        .get_bytes();
        
      var track_1 = new mode.Track(1,mode.instrument.VIOLIN)
        .add_note_on(512,0x3D,0x28)
        .add_note_off(512,0x3D)
        .get_bytes();
    
      deepEqual(
        header.add(track_0).add(track_1).array,
        [
          77,84,104,100, // header label
          0,0,0,6,       // header length
          0,1,0,2,0,128, // header data
          
          77,84,114,107, // chunk label
          0,0,0,16, // length
          0,192,0, // program change
          0,144,60,40,
          132,0,144,60,0,0,
          255,47,0,
          
          77,84,114,107, // chunk label
          0,0,0,17, // length
          0,193,40, // program change
          132,0,145,61,40,
          132,0,145,61,0,0,
          255,47,0
        ]
      );
    });
    
    test("File object", function() {
      var file = new mode.File(128);
      file.add_track(
        new mode.Track(0,mode.instrument.ACOUSTIC_GRAND_PIANO)
          .add_note_on(0,0x3C,0x28)
          .add_note_off(512,0x3C)
      ).add_track(
        new mode.Track(1,mode.instrument.VIOLIN)
          .add_note_on(512,0x3D,0x28)
          .add_note_off(512,0x3D)
      );    
      deepEqual(
        file.get_bytes().array,
        [
          77,84,104,100, // header label
          0,0,0,6,       // header length
          0,1,0,2,0,128, // header data
          
          77,84,114,107, // chunk label
          0,0,0,16, // length
          0,192,0, // program change
          0,144,60,40,
          132,0,144,60,0,0,
          255,47,0,
          
          77,84,114,107, // chunk label
          0,0,0,17, // length
          0,193,40, // program change
          132,0,145,61,40,
          132,0,145,61,0,0,
          255,47,0
        ]
      );
    });
    
    test("Music and Music.Track objects", function() {
      
      // empty containers:
      deepEqual(
        new mode.Music(128).get_file(),
        new mode.File(128)
      );
      deepEqual(
        new mode.Music.Track().get_midi_track(0),
        new mode.Track(0)
      );
      
      // track with one note:
      deepEqual(
        new mode.Music.Track()
          .add_note({'start':0,'stop':16,'pitch':64,'instrument':mode.instrument.VIOLIN})
          .get_midi_track(0),
        new mode.Track(0,mode.instrument.VIOLIN)
          .add_note_on(0,64,mode.Music.default_velocity)
          .add_note_off(16,64)
      );
      
      //
      
    });
    
  }
	
})();
