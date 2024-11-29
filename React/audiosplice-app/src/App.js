import React, { useState, useEffect, useRef } from "react";
import api from "./api";
import "./style.css";
import AudioWaveform from "./AudioWaveform";
import { FaPlay, FaPause } from "react-icons/fa";
// import axios from "axios";

// const apiUrl = "https://api.pamtalksaudiosplicing.com"; // server address for prod mode

const apiUrl = "http://localhost:8000"; // server address for dev mode

const SpliceAudio = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [audioFiles, setAudioFiles] = useState([]);
  const [timestamps, setTimestamps] = useState({
    start_times: [],
    end_times: [],
    extracted_timestamps: [],
  });
  const [csvLoading, setCsvLoading] = useState(false); // Separate loading state for CSV upload
  const [audioLoading, setAudioLoading] = useState(false); // Separate loading state for audio upload
  const [downloadLoading, setDownloadLoading] = useState(false); // Separate loading state for file download
  const [jobId, setJobId] = useState(null);

  const [audioFileNames, setAudioFileNames] = useState([]);

  const [processedAudioFiles, setProcessedAudioFiles] = useState([]); //new
  const [isAllPlaying, setIsAllPlaying] = useState(false);

  //const waveformRef = useRef([]);

  const [universalTime, setUniversalTime] = useState(0);

  const [buffer, setBuffer] = useState(0);

  ////////////////// UPLOAD STORYBOARD CSV ///////////////////////

  const handleCsvFileChange = (event) => {
    setCsvFile(event.target.files[0]);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;

    setCsvLoading(true);

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const result = await api.post(
        // "http://localhost:8000/upload/csv/",
        `${apiUrl}/upload/csv`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setTimestamps({
        start_times: result.data.start_times || [],
        end_times: result.data.end_times || [],
        extracted_timestamps: result.data.extracted_timestamps || [],
      });

      // const time_differences = result.data.end_times.map(
      //   (value, index) => value - result.data.start_times[index]
      // );

      // console.log("end times:", result.data.end_times);
      // console.log("start times:", result.data.start_times);
      // console.log("end times - start times:", time_differences);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setCsvLoading(false);
    }
  };

  ////////////// UPLOAD UNPROCESSED AUDIO FILES /////////////////////

  const handleAudioUpload = async () => {
    setAudioLoading(true);

    console.log("handleAudioUpload function called");
    if (audioFiles.length === 0) return;

    // console.log(
    //   "Timestamps state before sending:",
    //   timestamps.extracted_timestamps
    // );
    const formData = new FormData();
    formData.append(
      "timestamps",
      JSON.stringify({
        start_times: timestamps.start_times,
        end_times: timestamps.end_times,
      })
    );
    Array.from(audioFiles).forEach((file) => formData.append("files", file));

    try {
      const result = await api.post(
        // "http://localhost:8000/upload/audio/",
        `${apiUrl}/upload/audio`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setJobId(result.data.job_id);

      // alert('Audio files uploaded and processed successfully!');
      //console.log("Processed job  with id:", result.data.job_id);
      //console.log("Number of files:", audioFiles.length);
    } catch (error) {
      console.error("Error uploading audio files:", error);
    } finally {
      setAudioLoading(false);
    }
  };

  const handleBufferChange = async (buffer) => {
    try {
      const response = await api.post(`${apiUrl}/upload/audio/buffer`, {
        buffer,
      });

      setBuffer(response.data);
    } catch (error) {
      console.error("Error setting buffer:", error);
    }
  };

  const handleAudioFileChange = (event) => {
    // Convert FileList to array
    const newFilesArray = Array.from(event.target.files);

    // Update state with existing files and new files
    setAudioFiles((prevFiles) => [...prevFiles, ...newFilesArray]);
    // setAudioFileNames((prevFiles) =>
    //   [...prevFiles, ...newFilesArray].map((file) => file.name)
    // );
    setAudioFileNames((prevFileNames) => [
      ...prevFileNames,
      ...newFilesArray.map((file) => file.name),
    ]);
  };

  const handleRemoveFile = (fileName) => {
    // Remove file from audioFiles state
    setAudioFiles((prevFiles) =>
      prevFiles.filter((file) => file.name !== fileName)
    );

    // Remove file from audioFileNames state
    setAudioFileNames((prevFileNames) =>
      prevFileNames.filter((name) => name !== fileName)
    );
  };

  // Log the number of files
  useEffect(() => {
    console.log("Number of files:", audioFiles.length);
    console.log("Audio file names:", audioFileNames);
  }, [audioFiles, audioFileNames]);

  /////////////////// FETCH PROCESSED AUDIO ////////////////////

  useEffect(() => {
    const fetchProcessedAudioFiles = async () => {
      if (jobId) {
        try {
          const response = await fetch(
            // `http://localhost:8000/playaudio/${jobId}`
            `${apiUrl}/playaudio/${jobId}`
          );
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          const files = await response.json();
          //console.log("Fetched audio files:", files);
          // const baseUrl = "http://localhost:8000";
          const baseUrl = apiUrl;
          const absoluteUrls = files.map((file) => new URL(file, baseUrl).href);
          setProcessedAudioFiles(absoluteUrls);

          //console.log("URL:", absoluteUrls);
        } catch (error) {
          console.error("Failed to fetch audio files:", error);
        }
      }
    };

    fetchProcessedAudioFiles();
  }, [jobId]);

  ///////////////////////// PLAY AUDIO IN BROWSER //////////////////////////

  // Play all AudioWaveform instances
  const handlePlayAll = () => {
    setIsAllPlaying(true);
  };

  // Pause all AudioWaveform instances
  const handlePauseAll = () => {
    console.log("Pausing all audio...");
    setIsAllPlaying(false);
  };

  const PlayPauseButton = ({ isPlaying, togglePlay }) => {
    const [hovered, setHovered] = useState(false);
    const size = 60;
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
          width: size,
          height: size,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {isPlaying ? (
          <FaPause
            style={{
              height: size,
              width: size,
              color: hovered ? "purple" : "violet",
            }}
          />
        ) : (
          <FaPlay
            style={{
              height: size,
              width: size,
              color: hovered ? "purple" : "violet",
            }}
          />
        )}
      </div>
    );
  };

  const time_differences = timestamps.end_times.map(
    (value, index) => value - timestamps.start_times[index]
  );

  const cumulativeTime = [];
  let sum = 0;
  time_differences.forEach((value) => {
    sum += value;
    cumulativeTime.push(sum);
  });

  const handleTimestampClick = (index) => {
    if (index + 1) {
      console.log("index:", index);
      const clickedTime = cumulativeTime.map(
        (value) => (value - cumulativeTime[0]) / 1000
      )[index];
      setUniversalTime(clickedTime);
      console.log(
        "clicked timestamp start time:",
        cumulativeTime.map((value) => (value - cumulativeTime[0]) / 1000)[index]
      );
    } else {
      console.log("index not valid");
    }
    // const timestamp = timestamps.extracted_timestamps[index];
    // console.log(timestamp[0]);

    // if (typeof timestamp[0] == "string") {
    //   const [startTime, endTime] = timestamp[0].split(" --> ");
    //   const [time, milliseconds] = startTime.split(",");
    //   const [hours, minutes, seconds] = time.split(":");
    //   const clickedTime =
    //     (hours * 3600 + minutes * 60 + seconds) / 1000 + milliseconds;
    //   setUniversalTime(clickedTime);
    //   console.log("clicked timestamp start time:", clickedTime);
    // } else {
    //   console.log("timestamp is not a string");
    // }
  };

  ////////////////////// DOWNLOAD AUDIO /////////////////////////////

  const handleAudioDownload = async () => {
    if (!jobId) return;
    console.log("Downloading job with id :", jobId);

    setDownloadLoading(true);

    try {
      const response = await api.get(
        // `http://localhost:8000/download/${jobId}`,
        `${apiUrl}/download/${jobId}`,
        {
          //new
          responseType: "blob",
        }
      );

      // Create a URL for the file
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Create a link element and set the URL as href
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `processed_files_${jobId}.zip`); //new

      // Append link to the body and trigger a click to start download
      document.body.appendChild(link);
      link.click();
      link.remove(); //new

      // // Cleanup
      // link.parentNode.removeChild(link);
      // window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    } finally {
      setDownloadLoading(false);
    }
    alert("Audio files downloaded successfully!");
  };

  return (
    <div>
      <div className="header-img"></div>

      <header className="header">
        <span className="small-text-special">The </span>
        <span className="big-text">P</span>
        <span className="small-text">hysics and </span>
        <span className="big-text">A</span>
        <span className="small-text">stronomy </span>
        <span className="big-text">M</span>
        <span className="small-text">entorship </span>
        <span className="small-text-special">Talks</span> <br></br>
        <span className="fancy-text">Story-boarding Application</span>
      </header>

      <div className="root">
        <div className="inputs-row">
          <div className="inputs-column">
            <div className="text-content">
              <h1>First... upload your story-board ;)</h1>
              <p>Upload a CSV file. You do not need to remove extra text.</p>
              <label className="general-button">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                />
                Choose File
              </label>
              {csvFile?.name}
              <button onClick={handleCsvUpload} className="general-button">
                {csvLoading ? "Uploading..." : "Upload"}
              </button>
            </div>
            <div>
              <h1>Next... upload your audio files :)</h1>
              <p className="text-content">
                Upload your audio files. <br></br> They will all be edited
                according to the timestamps in your story-board. <br></br>
                This may take a few minutes!
              </p>
              <div className="file-upload-container">
                <label className="general-button">
                  <input
                    type="file"
                    accept=".m4a .mp3"
                    multiple
                    onChange={handleAudioFileChange}
                    className="file-input"
                  />
                  Choose Files
                </label>
                <button onClick={handleAudioUpload} className="general-button">
                  {audioLoading ? "Editing..." : "Edit Files"}
                </button>
                <span className="buffer-text">Set Buffer : </span>
                <input
                  type="number"
                  className="buffer-field"
                  onChange={handleBufferChange}
                />
                <span className="buffer-text">ms</span>
                {/* {audioFileNames.length > 0 && (
                  <div className="file-list">
                    <h4>Files to Upload:</h4>
                    <ul>
                      {audioFileNames.map((fileName, index) => (
                        <li key={index}>{fileName}</li>
                      ))}
                      <button onClick={() => handleRemoveFile(fileName)}>
                        Remove
                      </button>
                    </ul>
                  </div>
                )} */}
                {audioFileNames.length > 0 && (
                  <div className="file-list">
                    <h4>Files to Upload:</h4>
                    <ul>
                      {audioFileNames.map((fileName, index) => (
                        <li key={index}>
                          {fileName}
                          <button
                            onClick={() => handleRemoveFile(fileName)}
                            className="x-button"
                          >
                            X
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="timestamps-column">
            {timestamps.extracted_timestamps.length > 0 && (
              <div className="timestamps-container">
                <h2>Extracted Timestamps:</h2>
                <p style={{ marginBottom: "20px" }}>
                  You can scroll through the timestamps here to make sure they
                  look right!
                </p>
                <ul>
                  {timestamps.extracted_timestamps.map((timestamp, index) => (
                    <li key={index}>
                      <a href="#!" onClick={() => handleTimestampClick(index)}>
                        {timestamp.join(", ")}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="outputs-row">
          <div>
            {processedAudioFiles.length > 0 ? (
              processedAudioFiles.map((fileUrl, index) => (
                <AudioWaveform
                  isAllPlaying={isAllPlaying}
                  fileUrl={fileUrl}
                  index={index}
                  universalTime={universalTime}
                  setUniversalTime={setUniversalTime}
                />
              ))
            ) : (
              <p></p>
            )}
            <div
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "center",
              }}
            >
              <PlayPauseButton
                togglePlay={() => {
                  if (isAllPlaying) {
                    handlePauseAll();
                  } else {
                    handlePlayAll();
                  }
                }}
                isPlaying={isAllPlaying}
              />
            </div>

            {/* <button
              onClick={handlePlayAll}
              disabled={isAllPlaying}
              className="general-button"
            >
              Play All
            </button>
            <button
              onClick={handlePauseAll}
              disabled={!isAllPlaying}
              className="general-button"
            >
              Pause All
            </button> */}
          </div>
        </div>

        <div className="download-row">
          <div className="text-content">
            <h1> Finally... download your processed audio files!</h1>
            <div>
              <button onClick={handleAudioDownload} className="general-button">
                {downloadLoading ? "Downloading..." : "Download"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpliceAudio;
