import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { FaPlay, FaPause } from "react-icons/fa";

const AudioWaveform = ({
  fileUrl,
  index,
  isAllPlaying,
  universalTime,
  setUniversalTime,
}) => {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const audioElementRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    if (audioElementRef.current && isReady) {
      audioElementRef.current.play().catch((error) => {
        console.error("Audio play error:", error);
      });
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleCanPlay = () => {
    console.log("Audio can play now!");
    setIsReady(true);
  };

  const handleTimeUpdate = () => {
    if (audioElementRef.current && wavesurferRef.current) {
      const currentTime = audioElementRef.current.currentTime;
      wavesurferRef.current.seekTo(
        currentTime / audioElementRef.current.duration
      );
    }
  };

  // Create and set up WaveSurfer instance
  useEffect(() => {
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "violet",
      progressColor: "purple",
      height: 100,
      barWidth: 2,
      backend: "MediaElement",
    });

    wavesurferRef.current = wavesurfer;

    // Load the audio file into WaveSurfer
    wavesurfer.load(fileUrl);
    wavesurfer.on("click", (x, y) => {
      console.log(x, y);
      if (audioElementRef.current) {
        const seekTime = audioElementRef.current.duration * x;
        console.log(seekTime);
        audioElementRef.current.currentTime = seekTime;
        console.log("time", seekTime);
        // wavesurferRef.current.currentTime = seekTime; //new
        // console.log("time", wavesurferRef.current.currentTime);
        //console.log("previous universal time:", previousUniversalTime);
        setUniversalTime(seekTime);
        //console.log("current universal time:", universalTime);
      }
    });

    return () => {
      // if (wavesurferRef.current) {
      //   wavesurferRef.current.destroy();
      //   wavesurferRef.current = null;
      // }
      try {
        if (wavesurferRef.current) {
          console.log("Attempting to destroy Wavesurfer instance");
          wavesurferRef.current.destroy();
        }
      } catch (error) {
        console.error("Error destroying Wavesurfer instance:", error);
      }
    };
  }, [fileUrl, index]);

  // Create and set up HTML5 audio element
  useEffect(() => {
    if (!fileUrl) {
      console.error("No file URL provided");
      return;
    }
    if (wavesurferRef.current) {
      const audioElement = document.createElement("audio");
      audioElement.src = fileUrl;
      audioElement.preload = "metadata";
      document.body.appendChild(audioElement);
      audioElementRef.current = audioElement;

      audioElement.addEventListener("canplay", handleCanPlay);
      audioElement.addEventListener("timeupdate", handleTimeUpdate);
      // audioElement.onloadedmetadata = function () {
      //   audioElement.currentTime = universalTime;
      // };

      return () => {
        if (audioElementRef.current) {
          audioElementRef.current.pause();
          document.body.removeChild(audioElementRef.current);
          audioElementRef.current = null;
        }
        audioElement.removeEventListener("canplay", handleCanPlay);
        audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, [fileUrl, wavesurferRef.current]);

  // Handle play/pause based on isAllPlaying
  useEffect(() => {
    if (wavesurferRef.current) {
      if (isAllPlaying) {
        if (audioElementRef.current) {
          console.log("Duration:", audioElementRef.current.duration);
          wavesurferRef.current.seekTo(
            universalTime / audioElementRef.current.duration
          );
          // console.log(
          //   "seek to (percentage of audio file length):",
          //   universalTime / audioElementRef.current.duration
          // );
          audioElementRef.current.currentTime = universalTime;
        }
        handlePlay();
        //setUniversalTime(audioElementRef.current.currentTime); // not necessary?? with this statement, the above console log prints twice (and the second time, it prints 0 but only for the long transcript)
      } else {
        handlePause();
        //setUniversalTime(audioElementRef.current.currentTime); //this I think sets the time for both to the 2nd audio rec time (last loaded)
      }
    }
    console.log("current time:", audioElementRef.current.currentTime);
  }, [
    wavesurferRef.current,
    audioElementRef.current,
    isAllPlaying,
    universalTime,
  ]);

  return (
    <div>
      <div ref={waveformRef} style={{ width: "100%", height: "100px" }} />
      <PlayPauseButton
        togglePlay={() => {
          if (isPlaying) {
            handlePause();
          } else {
            handlePlay();
          }
        }}
        isPlaying={isPlaying}
      />
    </div>
  );
};

const PlayPauseButton = ({ isPlaying, togglePlay }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={togglePlay}
      onMouseEnter={() => {
        setHovered(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
      }}
      style={{
        width: 30,
        height: 30,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {isPlaying ? (
        <FaPause
          style={{
            height: 30,
            width: 30,
            color: hovered ? "grey" : "white",
          }}
        />
      ) : (
        <FaPlay
          style={{
            height: 30,
            width: 30,
            color: hovered ? "grey" : "white",
          }}
        />
      )}
    </div>
  );
};

export default AudioWaveform;
