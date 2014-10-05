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
  
  mode.encode_number = function(n) {
    // given a number,
    // return the SMF variable length encoded Bytes.
    if (!(n >= 0 && n <= 0x0FffFFff)) {
      throw new Error("Number out of bounds for variable length encoding: "+n);
    }
    var bytes = [n & 0x7F];
    var leftover = n >>> 7;
    while (leftover) {
      bytes.unshift(
        (leftover & 0x7F) | // 7 left-most bits.
        (0x80)              // set high-bit since this is not the lowest.
      );
      leftover = leftover >>> 7;
    }
    return new my.Bytes(bytes);
  }
  
  mode.Music = function(tempo) {
    // High-level interface for MIDI creation.
    // Most obviously, instead of working with deltas,
    // all times are absolute, and notes can be specified in any order.
    
    this.notes = [];
    
    this.add_note = function(hash) {
      // given a hash with these keys:
      //   start
      //   stop
      //   pitch
      //   instrument
      // adds that note to the music.
      // Returns the modified object for chaining.
      if (!("start" in hash) || !("stop" in hash) || 
          !("pitch" in hash) || !("instrument" in hash)) {
        throw new Error("Each note must have start, stop, pitch, and instrument");
      }
      this.notes.push(hash);
      return this;
    }
   
    this.play = function() {
      // plays the MIDI by creating an embedded object on the page.
      throw new Error("unimplemented");
    
    }
    
    this.get_bytes = function() {
      // returns the Bytes of the corresponding midi file.
      return this.get_file().get_bytes();
    }
    
    this.get_file = function() {
      
      var note;
      var track;
      var timestamps;
      var last_time;
      var track_objects = [];
      var file = new mode.File(tempo);
      
      // first partition the notes by instrument:
      // each instrument will go in its own track.
      
      var tracks = {}; // indexed by instrument number
      for (var i = 0; i<this.notes.length; i++) {
        note = this.notes[i];
        if (!(note.instrument in tracks)) {
          tracks[note.instrument] = new mode.Music.Track();
        }
        tracks[note.instrument].add_note(note);
      }
      
      var channel = 0;
      for (var instrument in tracks) {
        file.add_track(
          tracks[instrument].get_midi_track(channel)
        );
        channel++;
      }
      
      return file;
      
    }
  }
  
  mode.Music.default_velocity = 32;
  
  mode.Music.Track = function() {
 
    var instrument;
    var starts = {};
    var stops = {};
    // each maps timestamps to lists of pitches.
 
    this.add_note = function(note) {
      if (instrument == null) {
        instrument = note.instrument;
      }
      else if (instrument != note.instrument) {
        throw new Error("Tracks can only have a single instrument.");
      }
      
      if (starts[note.start] == null) {
        starts[note.start] = []
      }
      starts[note.start].push(note.pitch);
      
      
      if (stops[note.stop] == null) {
        stops[note.stop] = []
      }
      stops[note.stop].push(note.pitch);
      return this;
    }
    
    this.get_midi_track = function(channel) {
      if (channel == null) {
        throw new Error("channel must be specified for midi track.");
      }
      var midi_track = new mode.Track(channel,instrument);
      var timestamps = [];
      var last_t = 0;
      var t;
      
      // collect the timestamps
      for (var t in starts) {
        timestamps.push(parseInt(t));
      }
      for (var t in stops) {
        if (!(t in timestamps)) {
          timestamps.push(parseInt(t));
        }
      }
      
      timestamps = timestamps.sort(function(a,b){return a-b});
      for (var t_index = 0; t_index<timestamps.length; t_index++) {
        t = timestamps[t_index];
        if (t in starts) {
          for (var i = 0; i<starts[t].length; i++) {
            midi_track.add_note_on(
              t-last_t, starts[t][i], mode.Music.default_velocity
            );
            last_t = t;
          }
        }
        if (t in stops) {
          for (var i = 0; i<stops[t].length; i++) {
            midi_track.add_note_off(
              t-last_t, stops[t][i], mode.Music.default_velocity
            );
            last_t = t;
          }
        }
      }
      
      return midi_track;
    }
  
  }
      
     
  mode.File = function(tempo) {
    this.tracks = [];
    this.tempo = tempo;
    
    this.add_track = function(track) {
      this.tracks.push(track);
      return this;
    }
    
    this.get_bytes = function() {
      var bytes = new my.Bytes("MThd")
        .add(6,{bytes:4})    // The size in bytes of the rest of the Header chunk.
        .add(1,{bytes:2})    // Type-1 MIDI file: there can be multiple tracks in the file.
        .add(this.tracks.length,{bytes:2})    // Number of tracks
        .add(tempo,{bytes:2}); // The number of ticks per quarter note (128)
      for (var i = 0; i < this.tracks.length; i++) {
        bytes.add(this.tracks[i].get_bytes())
      }
      return bytes;
    }
  }
  
  mode.event_type = {
    "NOTE_OFF": 0x8,
    "NOTE_ON":  0x9,
    "NOTE_AFTERTOUCH": 	0xA,
    "CONTROLLER":  	0xB,
    "PROGRAM_CHANGE":  	0xC,
    "CHANNEL_AFTERTOUCH": 	0xD,
    "PITCH_BEND": 0xE,
  }
  
  mode.Track = function(channel,instrument) {
    
    function event(delta,event_type,channel,param_1,param_2) {
      // given the defining information,
      // returns the bytes of the corresponding event
      return mode.encode_number(delta)
        .add((event_type << 4) | channel)
        .add([param_1,param_2])
    }
    
    this.note_on = function(delta,note_number,velocity) {
      if (delta < 0 || delta >= 0x0FffFFff) {
        throw new Error("delta out of bounds: "+delta)
      }
      if (note_number < 0 || note_number > 127) {
        throw new Error("note number out of bounds: "+note_number)
      }
      if (velocity < 0 || velocity > 127) {
        throw new Error("velocity out of bounds: "+velocity)
      }      
      return event(delta,mode.event_type.NOTE_ON,this.channel,note_number,velocity)
    }

    this.note_off = function(delta,note_number) {
      if (delta < 0 || delta >= 0x0FffFFff) {
        throw new Error("delta out of bounds: "+delta)
      }
      if (note_number < 0 || note_number > 127) {
        throw new Error("note number out of bounds: "+note_number)
      }
      return event(delta,mode.event_type.NOTE_ON,this.channel,note_number,0)
    }
    
    this.program_change = function(instrument) {
      return event(0,mode.event_type.PROGRAM_CHANGE,this.channel,instrument)
    }
    
    function meta_event(delta,type,length,data) {
       // given the defining information,
       // returns the bytes of the corresponding meta event
       // note: length (in bytes) is a constant for each type:
       //       we could just do a look-up.
       return mode.encode_number(delta)
         .add([0xFF,type])
         .add(mode.encode_number(length))
         .add(data);
    }
    
    function end_of_track() {
      // returns the bytes of the end-of-track event.
      return meta_event(0,0x2F,0,[])
    }
    
    this.add_note_on = function(delta,note_number,velocity) {
      // adds note-event
      // returns object for chaining
      this.bytes.add(this.note_on(delta,note_number,velocity));
      return this;
    }
    
    this.add_note_off = function(delta,note_number) {
      // adds note-off
      // returns object for chaining
      this.bytes.add(this.note_off(delta,note_number));
      return this;
    }
    
    this.get_bytes = function() {
      var data = new my.Bytes(this.bytes).add(end_of_track());
      return new my.Bytes("MTrk")
        .add(data.array.length,{"bytes":4})
        .add(data);
    }
  
    this.channel = channel;
    this.bytes = this.program_change(instrument);
  
  }
  
  mode.instrument = {
    // derived from http://253.ccarh.org/handout/gminstruments/
    
    // Piano Timbres:
    "ACOUSTIC_GRAND_PIANO":	0,
    "BRIGHT_ACOUSTIC_PIANO":	1,
    "ELECTRIC_GRAND_PIANO":	2,
    "HONKY_TONK_PIANO":	3,
    "RHODES_PIANO":	4,
    "CHORUSED_PIANO":	5,
    "HARPSICHORD":	6,
    "CLAVINET":	7,
    // Chromatic Percussion:
    "CELESTA":	8,
    "GLOCKENSPIEL":	9,
    "MUSIC_BOX":	10,
    "VIBRAPHONE":	11,
    "MARIMBA":	12,
    "XYLOPHONE":	13,
    "TUBULAR_BELLS":	14,
    "DULCIMER":	15,
    // Organ Timbres:
    "HAMMOND_ORGAN":	16,
    "PERCUSSIVE_ORGAN":	17,
    "ROCK_ORGAN":	18,
    "CHURCH_ORGAN":	19,
    "REED_ORGAN":	20,
    "ACCORDION":	21,
    "HARMONICA":	22,
    "TANGO_ACCORDION":	23,
    // Guitar Timbres:
    "ACOUSTIC_NYLON_GUITAR":	24,
    "ACOUSTIC_STEEL_GUITAR":	25,
    "ELECTRIC_JAZZ_GUITAR":	26,
    "ELECTRIC_CLEAN_GUITAR":	27,
    "ELECTRIC_MUTED_GUITAR":	28,
    "OVERDRIVEN_GUITAR":	29,
    "DISTORTION_GUITAR":	30,
    "GUITAR_HARMONICS":	31,
    // Bass Timbres:
    "ACOUSTIC_BASS":	32,
    "FINGERED_ELECTRIC_BASS":	33,
    "PLUCKED_ELECTRIC_BASS":	34,
    "FRETLESS_BASS":	35,
    "SLAP_BASS_1":	36,
    "SLAP_BASS_2":	37,
    "SYNTH_BASS_1":	38,
    "SYNTH_BASS_2":	39,
    // String Timbres:
    "VIOLIN":	40,
    "VIOLA":	41,
    "CELLO":	42,
    "CONTRABASS":	43,
    "TREMOLO_STRINGS":	44,
    "PIZZICATO_STRINGS":	45,
    "ORCHESTRAL_HARP":	46,
    "TIMPANI":	47,
    // Ensemble Timbres:
    "STRING_ENSEMBLE_1":	48,
    "STRING_ENSEMBLE_2":	49,
    "SYNTH_STRINGS_1":	50,
    "SYNTH_STRINGS_2":	51,
    "CHOIR_AAH":	52,
    "CHOIR_OOH":	53,
    "SYNTH_VOICE":	54,
    "ORCHESTRAL_HIT":	55,
    // Brass Timbres:
    "TRUMPET":	56,
    "TROMBONE":	57,
    "TUBA":	58,
    "MUTED_TRUMPET":	59,
    "FRENCH_HORN":	60,
    "BRASS_SECTION":	61,
    "SYNTH_BRASS_1":	62,
    "SYNTH_BRASS_2":	63,
    // Reed Timbres:
    "SOPRANO_SAX":	64,
    "ALTO_SAX":	65,
    "TENOR_SAX":	66,
    "BARITONE_SAX":	67,
    "OBOE":	68,
    "ENGLISH_HORN":	69,
    "BASSOON":	70,
    "CLARINET":	71,
    // Pipe Timbres:
    "PICCOLO":	72,
    "FLUTE":	73,
    "RECORDER":	74,
    "PAN_FLUTE":	75,
    "BOTTLE_BLOW":	76,
    "SHAKUHACHI":	77,
    "WHISTLE":	78,
    "OCARINA":	79,
    // Synth Lead:
    "SQUARE_WAVE_LEAD":	80,
    "SAWTOOTH_WAVE_LEAD":	81,
    "CALLIOPE_LEAD":	82,
    "CHIFF_LEAD":	83,
    "CHARANG_LEAD":	84,
    "VOICE_LEAD":	85,
    "FIFTHS_LEAD":	86,
    "BASS_LEAD":	87,
    // Synth Pad:
    "NEW_AGE_PAD":	88,
    "WARM_PAD":	89,
    "POLYSYNTH_PAD":	90,
    "CHOIR_PAD":	91,
    "BOWED_PAD":	92,
    "METALLIC_PAD":	93,
    "HALO_PAD":	94,
    "SWEEP_PAD":	95,
    // Synth Effects:
    "RAIN_EFFECT":	96,
    "SOUNDTRACK_EFFECT":	97,
    "CRYSTAL_EFFECT":	98,
    "ATMOSPHERE_EFFECT":	99,
    "BRIGHTNESS_EFFECT":	100,
    "GOBLINS_EFFECT":	101,
    "ECHOES_EFFECT":	102,
    "SCI_FI_EFFECT":	103,
    // Ethnic Timbres:
    "SITAR":	104,
    "BANJO":	105,
    "SHAMISEN":	106,
    "KOTO":	107,
    "KALIMBA":	108,
    "BAGPIPE":	109,
    "FIDDLE":	110,
    "SHANAI":	111,
    // Sound Effects:
    "TINKLE_BELL":	112,
    "AGOGO":	113,
    "STEEL_DRUMS":	114,
    "WOODBLOCK":	115,
    "TAIKO_DRUM":	116,
    "MELODIC_TOM":	117,
    "SYNTH_DRUM":	118,
    "REVERSE_CYMBAL":	119,
    // Sound Effects:
    "GUITAR_FRET_NOISE":	120,
    "BREATH_NOISE":	121,
    "SEASHORE":	122,
    "BIRD_TWEET":	123,
    "TELEPHONE_RING":	124,
    "HELICOPTER":	125,
    "APPLAUSE":	126,
    "GUN_SHOT":	127
  }
  
//   mode.Music = function() {
//     // A Music object can have notes added to it,
//     // and can be rendered as bytes of midi.
//     
//     this.instrument = function(instrument_const) {
//       // Set the cursor's instrument:
//       // successive notes added will be played with this instrument.
//       // Returns the modified Music for chaining.
//     
//     }
//     
//     this.tempo = function(bpm) {
//       // Sets the tempo at this point in the music.
//       // Returns the modified Music for chaining.
//       
//     }
//     
//     this.volume = function(vol) {
//       // Sets the volume for successive notes.
//       // Returns the modified Music for chaining.
//       
//     }
//     
//     this.get_cursor = function() {
//       // Returns a time that can be used with set_cursor() to add more notes on top of existing.
//     
//     }
//     
//     this.set_cursor = function(cursor) {
//       // Given a time, sets the cursor at that point.
//       // Returns a modified Music for chaining.
//       
//     }
//     
//     this.add = function() {
//       // Given a sequence of numbers and strings or arrays, adds successive notes to the music.
//       // Returns the modified Music for chaining.
//       //
//       // The varargs should have this structure:
//       //   (Number (String | Array)+ )+
//       // A number will set the length, in beats, of successive notes.
//       // A string or array represents a set of simultaneously sounding nodes;
//       // an emptry string or arry is a rest. 
//       // -- In strings, pitches are given in scientific pitch notation.
//       //    http://en.wikipedia.org/wiki/Scientific_pitch_notation
//       //    C4 is middle C. "G3 C4 Eb4" is an inverted C minor chord, with G on the bottom.
//       //    Spaces are optional. Should be case insensitive, and enharmonics should work.
//       // -- In arrays, all values should be integers, and these integers are
//       //    the midi note values.
//       
//     }
//     
//     function convert_note_names(names) {
//       // Given a string of note names,
//       // returns an array of the corresponding midi pitch numbers
//       
//     }
//     
//     this.get_midi = function() {
//       // returns the music as midi Bytes.
//     
//     }
//     
//    }
	
})();
