import React, { useState } from 'react';
import api from './api';
import './FileUpload.css'; // Import CSS file for styling

const FileUpload = () => {
  console.log("FileUpload component rendered");

  const [csvFile, setCsvFile] = useState(null);
  const [audioFiles, setAudioFiles] = useState([]);
  //const [timestamps, setTimestamps] = useState([]); // State for timestamps
  // State initialization
  const [timestamps, setTimestamps] = useState({
    start_times: [],
    end_times: [],
    extracted_timestamps: []  // Ensure extracted_timestamps is included
  });
  const [loading, setLoading] = useState(false); // State for loading indicator
  const [fileId, setFileId] = useState(null);

  const handleCsvFileChange = (event) => {
    setCsvFile(event.target.files[0]);
  };

  const handleAudioFileChange = (event) => {
    setAudioFiles(event.target.files);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;

    setLoading(true); // Set loading state to true

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const result = await api.post('http://localhost:8000/upload/csv/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      //setTimestamps(result.data.extracted_timestamps); 
        // Update state with all relevant data
      setTimestamps({
        start_times: result.data.start_times || [],
        end_times: result.data.end_times || [],
        extracted_timestamps: result.data.extracted_timestamps || []
    });

    

    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false); // Reset loading state
    }

  };

  const handleAudioUpload = async () => {
    console.log("handleAudioUpload function called");
    if (audioFiles.length === 0) return;

    // Debugging: Log the timestamps state
    console.log("Timestamps state before sending:", timestamps.extracted_timestamps); // To do: there is an issue with the formatting of timestamps, it is an array of arrays each with one element

    const formData = new FormData();
    //timestamps.forEach(ts => formData.append('timestamps', JSON.stringify(ts)));
    formData.append('timestamps', JSON.stringify({ start_times: timestamps.start_times, end_times: timestamps.end_times }));
    Array.from(audioFiles).forEach(file => formData.append('files', file));

    try {
        const result = await api.post('http://localhost:8000/upload/audio/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if(result.data.file_id){
          setFileId(result.data.file_id)
        }
        alert('Audio files uploaded and processed successfully!');
        console.log('file id:', result.data.file_id)
        console.log('file id (should be the same?):', fileId) //it updates this one iteration later...hmm
    } catch (error) {
        console.error('Error uploading audio files:', error);
    }

  };

  const handleAudioDownload = async () => {
    if (!fileId) return;

    console.log('Downloading file with id:', fileId);

    setLoading(true);

    try {
      const response = await api.get(`http://localhost:8000/download/${fileId}/filename.wav`, {
        responseType: 'blob'
      });
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div>
      <h2>
        Upload transcript
      </h2>
      <input type="file" accept=".csv" onChange={handleCsvFileChange} />
      <button onClick={handleCsvUpload} disabled={loading}>
        {loading ? 'Uploading...' : 'Upload'}
      </button>

      {timestamps.extracted_timestamps.length > 0 && (
        <div className="timestamps-container">
          <h3>Extracted Timestamps:</h3>
          <ul>
            {timestamps.extracted_timestamps.map((timestamp, index) => (
              <li key={index}>{timestamp.join(', ')}</li>
            ))}
          </ul>
        </div>
      )}

      <h2>Upload audio files</h2>

      <div className="file-upload-container">
        <input type="file" accept=".m4a" multiple onChange={handleAudioFileChange} className="file-input" />
        <button onClick={handleAudioUpload} disabled={loading} className="upload-button">
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      <h2> Download audio files</h2>

      <div>
        <button onClick={handleAudioDownload} disabled={loading} className="download-button">
        {loading ? 'Downloading...' : 'Download'}
        </button>
      </div>

    </div>
  );
};

export default FileUpload;