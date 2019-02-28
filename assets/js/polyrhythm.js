let loopBeat;
let bassSynth;
let fmSynth;
let lowPass;
let synthSeq;
let hiHat;
let hatSeq;

function setup() {
  lowPass = new Tone.Filter(350, 'lowpass').toMaster();

  bassSynth = new Tone.MembraneSynth().toMaster();
  fmSynth = new Tone.FMSynth().connect(lowPass);
  pluckSynth = new Tone.PluckSynth().toMaster();
  hiHat = new Tone.Synth({
    oscillator  : {
    type  : 'square'
    }  ,
    envelope  : {
    attack  : 0.001 ,
    decay  : 0.001 ,
    sustain  : 0.001 ,
    release  : .001
    },
    volume : -18,
    }).toMaster();

  synthSeq = new Tone.Pattern(function(time, note){
  	fmSynth.triggerAttackRelease(note, 0.125);
  }, ["E3", "B3", "E3", "G3", "D3"]);
  synthSeq.playbackRate = 2;
  synthSeq.start(0);

  hatSeq = new Tone.Pattern(function(time, note){
  	hiHat.triggerAttackRelease(note, 0.125);
  }, ["B5", "B5", "B10"]);
  hatSeq.playbackRate = 3;
  hatSeq.start(0);

  loopBeat = new Tone.Loop(song, '4n');
  Tone.Transport.start();
  Tone.Transport.bpm.value = 120;
  loopBeat.start(0);
}

function song(time) {
  bassSynth.triggerAttackRelease('E1', 0.5, time);
  // fmSynth.triggerAttackRelease('c5', 0.25, time);
  // console.log(time);
}

function startSong() {
  Tone.Transport.start();
}

function stopSong() {
  Tone.Transport.stop();
}

var slider = document.getElementById("bpmRange");
var output = document.getElementById("demo");

output.innerHTML = slider.value;

slider.oninput = function() {
  output.innerHTML = this.value;
  Tone.Transport.bpm.value = this.value;
}

setup();
song();
