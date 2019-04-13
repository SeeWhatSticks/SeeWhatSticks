document.addEventListener("DOMContentLoaded", function() { initialise(); }, false);

const seeWhatSticks = {
  songs: {
    journey: {
      title: "Journey",
      segments: {
        intro: {
          name: "Introduction",
          titles: ["intro_arp", "intro_bass", "intro_hats"],
          duration: 24.303791666666665,
          startLogic: function() {
            for (track of Object.values(this.tracks)) {
              playAudio(track, seeWhatSticks.nextLoopTime);
            }
            incNextLoopTime(this.duration);
            let nextLoop = getSegment("journey", "loop1");
            setNextLoop(nextLoop);
            preload(nextLoop);
            $("#rng_loop1_repeats").val(4);
            $("#fld_loop1_repeats").text($("#rng_loop1_repeats").val());
          }
        },
        loop1: {
          name: "First Loop",
          titles: ["loop1_arp", "loop1_bass", "loop1_pizz", "loop1_drums", "loop1_hats", "loop1_pianoarp", "loop1_pianochord", "loop1_pulse"],
          duration: 12.151895833333333,
          bass: true,
          chords: true,
          pulse: true,
          firstRun: true,
          startLogic: function() {
            if (this.firstRun) {
              preload(getSegment("journey", "loop2"));
              this.firstRun = false;
            }
            let startTime = seeWhatSticks.nextLoopTime;
            playAudio(this.tracks.loop1_arp, startTime);
            playAudio(this.tracks.loop1_drums, startTime);
            playAudio(this.tracks.loop1_hats, startTime);
            if (this.bass) {
              playAudio(this.tracks.loop1_bass, startTime);
            } else {
              playAudio(this.tracks.loop1_pizz, startTime);
            }
            if (this.chords) {
              playAudio(this.tracks.loop1_pianochord, startTime);
            } else {
              playAudio(this.tracks.loop1_pianoarp, startTime);
            }
            if (this.pulse) {
              playAudio(this.tracks.loop1_pulse, startTime);
            }
            incNextLoopTime(this.duration);
            if ($("#rng_loop1_repeats").val() > 0) {
              $("#rng_loop1_repeats").val($("#rng_loop1_repeats").val() - 1);
              $("#fld_loop1_repeats").text($("#rng_loop1_repeats").val());
            } else {
              setNextLoop(getSegment("journey", "loop2"));
            }
          }
        },
        loop2: {
          name: "Second Loop",
          titles: ["loop2_arp", "loop2_bass", "loop2_drums", "loop2_guitar", "loop2_hats", "loop2_piano"],
          duration: 24.303791666666665,
          startLogic: function() {
            for (track of Object.values(this.tracks)) {
              playAudio(track, seeWhatSticks.nextLoopTime);
            }
            incNextLoopTime(this.duration);
          }
        }
      }
    }
  }
};

function initialise() {
  $("#btn_prepare").click(function (event) {
    prepare();
  });
  $("#btn_beginPlayback").click(function (event) {
    beginPlayback();
  });

  //Let's crawl over the songs object to add in extra information that will help us navigate
  //We can add the name of the song, segment and title to the song object, segment object and each
  //  track object so we can climb back up and find other tracks when we need to
  //Add empty elements arrays to songs and segments that don't have them
  let songs = seeWhatSticks.songs;
  for (let song of Object.keys(songs)) {
    songObject = seeWhatSticks.songs[song];
    songObject.song = song;
    for (let segment of Object.keys(songs[song].segments)) {
      segmentObject = seeWhatSticks.songs[song].segments[segment];
      segmentObject.song = song;
      segmentObject.segment = segment;
      segmentObject.paths = [];
      segmentObject.tracks = {};
      segmentObject.controls = {};
      for (let i = 0; i < segmentObject.titles.length; i++) {
        let title = segmentObject.titles[i];
        segmentObject.tracks[title] = song + "/" + title + ".mp3";
      }
    }
  }

  $("#rng_loop1_repeats").on("change", function(event) {
    $("#fld_loop1_repeats").text(event.target.value);
  });
  $("#btn_loop1_bass").on("click", function(event) {
    getSegment("journey", "loop1").bass = true;
    $("#btn_loop1_bass").attr("disabled", true);
    $("#btn_loop1_pizz").attr("disabled", false);
  });
  $("#btn_loop1_pizz").on("click", function(event) {
    getSegment("journey", "loop1").bass = false;
    $("#btn_loop1_pizz").attr("disabled", true);
    $("#btn_loop1_bass").attr("disabled", false);
  });
  $("#btn_loop1_chords").on("click", function(event) {
    getSegment("journey", "loop1").chords = true;
    $("#btn_loop1_chords").attr("disabled", true);
    $("#btn_loop1_arp").attr("disabled", false);
  });
  $("#btn_loop1_arp").on("click", function(event) {
    getSegment("journey", "loop1").chords = false;
    $("#btn_loop1_arp").attr("disabled", true);
    $("#btn_loop1_chords").attr("disabled", false);
  });
  $("#btn_loop1_pulseOn").on("click", function(event) {
    getSegment("journey", "loop1").pulse = true;
    $("#btn_loop1_pulseOn").attr("disabled", true);
    $("#btn_loop1_pulseOff").attr("disabled", false);
  });
  $("#btn_loop1_pulseOff").on("click", function(event) {
    getSegment("journey", "loop1").pulse = false;
    $("#btn_loop1_pulseOff").attr("disabled", true);
    $("#btn_loop1_pulseOn").attr("disabled", false);
  });
}

function prepare() {
  seeWhatSticks.audioCtx = new AudioContext();
  seeWhatSticks.nextLoopTime = 0.0;
  seeWhatSticks.nextLoop = seeWhatSticks.songs.journey.segments.intro;
  preload(seeWhatSticks.songs.journey.segments.intro);
  $("#btn_prepare").hide();
  $("#btn_beginPlayback").show();
}
function beginPlayback() {
  $("#btn_beginPlayback").hide();
  seeWhatSticks.nextLoopTime = seeWhatSticks.audioCtx.currentTime;
  seeWhatSticks.nextLoop.startLogic();
  seeWhatSticks.scheduler = window.setInterval(runScheduler, 25);
}

function preload(segment) {
  for (let track of Object.keys(segment.tracks)) {
    //This function changes each track value from a string
    //  representing the path to a buffer object
    let request = new XMLHttpRequest();
    request.open("GET", segment.tracks[track], true);
    request.responseType = "arraybuffer";
    request.onload = function() {
      seeWhatSticks.audioCtx.decodeAudioData(request.response, function(buffer) {
        segment.tracks[track] = buffer;
      }, function(e) {
        console.log("Error decoding audio data:")
        console.log(e);
      });
    }
    request.send();
  }
}
function playAudio(buffer, delay) {
  let audioCtx = seeWhatSticks.audioCtx;
  let source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination)
  source.start(delay);
}
function getTotalAudios(segment) {
  return segment.titles.length;
}
function incNextLoopTime(time) {
  seeWhatSticks.nextLoopTime += time;
}
function setNextLoop(loop) {
  seeWhatSticks.nextLoop = loop;
}
function runScheduler() {
  if (seeWhatSticks.audioCtx.currentTime + 0.25 > seeWhatSticks.nextLoopTime) {
    seeWhatSticks.nextLoop.startLogic();
  }
}
function getSong(song) {
  return seeWhatSticks.songs[song];
}
function getSegment(song, segment) {
  return seeWhatSticks.songs[song].segments[segment];
}