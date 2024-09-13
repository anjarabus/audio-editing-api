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
        setUniversalTime(seekTime);
      }
    });

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
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
      document.body.appendChild(audioElement);
      audioElementRef.current = audioElement;

      audioElement.addEventListener("canplay", handleCanPlay);
      audioElement.addEventListener("timeupdate", handleTimeUpdate);

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
          wavesurferRef.current.seekTo(
            universalTime / audioElementRef.current.duration
          );
          audioElementRef.current.currentTime = universalTime;
        }
        handlePlay();
      } else {
        handlePause();
        setUniversalTime(audioElementRef.current.currentTime);
      }
    }
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
  return (
    <div
      onClick={togglePlay}
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
          }}
        />
      ) : (
        <FaPlay
          style={{
            height: 30,
            width: 30,
          }}
        />
      )}
    </div>
  );
};

export default AudioWaveform;
