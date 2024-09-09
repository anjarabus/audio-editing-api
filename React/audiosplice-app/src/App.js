import React, { useState } from 'react';
import api from './api';
import './FileUpload.css'; // Import CSS file for styling

const FileUpload = () => {
  console.log("FileUpload component rendered");

  const [csvFile, setCsvFile] = useState(null);
  const [audioFiles, setAudioFiles] = useState([]);
  const [timestamps, setTimestamps] = useState({
    start_times: [],
    end_times: [],
    extracted_timestamps: []  // Ensure extracted_timestamps is included
  });
  const [csvLoading, setCsvLoading] = useState(false); // Separate loading state for CSV upload
  const [audioLoading, setAudioLoading] = useState(false); // Separate loading state for audio upload
  const [downloadLoading, setDownloadLoading] = useState(false); // Separate loading state for file download
  const [jobId, setJobId] = useState(null);

  const [audioFileNames, setAudioFileNames] = useState([]);

  const handleCsvFileChange = (event) => {
    setCsvFile(event.target.files[0]);
  };

  const handleAudioFileChange = (event) => { 
    // Convert FileList to array
    const newFilesArray = Array.from(event.target.files);
    
    // Update state with existing files and new files
    setAudioFiles(prevFiles => [...prevFiles, ...newFilesArray]);
    setAudioFileNames(prevFiles => [...prevFiles, ...newFilesArray].map(file => file.name)); 
    
    // Log the number of files
    console.log('Number of files:', [...audioFiles, ...newFilesArray].length);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;

    setCsvLoading(true); // Set loading state to true

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
      setCsvLoading(false); // Reset loading state
    }

  };

  const handleAudioUpload = async () => {

    setAudioLoading(true);

    console.log("handleAudioUpload function called");
    if (audioFiles.length === 0) return;

    console.log("Timestamps state before sending:", timestamps.extracted_timestamps); 
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

        setJobId(result.data.job_id);// new
        alert('Audio files uploaded and processed successfully!');
        console.log('Processed job  with id:',result.data.job_id)
        console.log('Number of files:', audioFiles.length);

    } catch (error) {
        console.error('Error uploading audio files:', error);
    } finally {
      setAudioLoading(false);
    }

  };

  const handleAudioDownload = async () => {
    if (!jobId) return;
    console.log('Downloading job with id :',jobId)

    setDownloadLoading(true);


    try {
      //const response = await api.get(`http://localhost:8000/download/${fileId}/${fileName}_edited.wav`, {
      const response = await api.get(`http://localhost:8000/download/${jobId}`, { //new
        responseType: 'blob'
      });
  
      // Create a URL for the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
  
      // Create a link element and set the URL as href
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download',`processed_files_${jobId}.zip`); //new

      // Append link to the body and trigger a click to start download
      document.body.appendChild(link);
      link.click();
      link.remove(); //new
  
      // // Cleanup
      // link.parentNode.removeChild(link);
      // window.URL.revokeObjectURL(url);
  
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setDownloadLoading(false);
    }
    alert('Audio files downloaded successfully!');
  };


  return (
    <div>
      <h2>
        Upload transcript
      </h2>
      <input type="file" accept=".csv" onChange={handleCsvFileChange} />
      <button onClick={handleCsvUpload} disabled={csvLoading}>
        {csvLoading ? 'Uploading...' : 'Upload'}
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
        <button onClick={handleAudioUpload} disabled={audioLoading} className="upload-button">
          {audioLoading ? 'Uploading...' : 'Upload'}
        </button>
        {audioFileNames.length > 0 && (
          <div className="file-list">
            <h3>Files to Upload:</h3>
            <ul>
              {audioFileNames.map((fileName, index) => (
                <li key={index}>{fileName}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <h2> Download audio files</h2>

      <div>
        <button onClick={handleAudioDownload} disabled={downloadLoading} className="download-button">
        {downloadLoading ? 'Downloading...' : 'Download'}
        </button>
      </div>

    </div>
  );
};

export default FileUpload;
