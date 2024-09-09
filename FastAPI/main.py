from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import StreamingResponse
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import re
import csv
import zipfile
import os
import io
import logging
from pydub import AudioSegment 


app = FastAPI()

logging.basicConfig(level=logging.INFO)

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# In-memory storage for job-related files
job_storage = {}

@app.post("/upload/csv/")
async def upload_csv(file: UploadFile = File(...)):

    tss = []

    contents = await file.read()
    
    csvfile = io.StringIO(contents.decode('utf-8-sig'))
    
    reader = csv.reader(csvfile)

    for row in reader:
        for cell in row:
            ts = re.findall(r"\d\d:\d\d:\d\d,\d\d\d\s-->\s\d\d:\d\d:\d\d,\d\d\d", cell)
            if ts:
                tss.append(ts)

    logging.info(f"Extracted timestamps: {tss}")  

    start_times=[]
    end_times=[]

    for ts in tss:
        hrs=ts[0][0:2]
        mins=ts[0][3:5]
        secs=ts[0][6:8]
        ms=ts[0][9:12]
        try: time = (int(hrs)*3600+int(mins)*60+int(secs))*1000+ int(ms) #time in milliseconds
        except: time='none'
        start_times.append(time)

        logging.info(f"hrs mins secs ms: {int(hrs)} {int(mins)} {int(secs)} {int(ms)}")
        logging.info(f"start time: {(int(hrs)*3600+int(mins)*60+int(secs))*1000 +int(ms)}")

        hrs = ts[0][17:19]
        mins = ts[0][20:22]
        secs = ts[0][23:25]
        ms=ts[0][26:29]
        try: time = (int(hrs)*3600+int(mins)*60+int(secs))*1000 +int(ms) #time in milliseconds
        except: time='none'
        end_times.append(time)

        logging.info(f"hrs mins secs ms: {int(hrs)} {int(mins)} {int(secs)} {int(ms)}")
        logging.info(f"end time: {(int(hrs)*3600+int(mins)*60+int(secs))*1000 +int(ms)}")
    
    return {"extracted_timestamps": tss, "start_times": start_times, "end_times": end_times}

# In-memory storage for file information
file_info_storage = {}

@app.post("/upload/audio/")
async def upload_audio(
    files: List[UploadFile] = File(...),
    timestamps: str = Form(...),  # Accept timestamps as a JSON string
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    
    logging.info(f"Received timestamps: {timestamps}")
    
    try:
        import json
        timestamps = json.loads(timestamps)
        logging.info(f"Parsed timestamps: {timestamps}")
    except json.JSONDecodeError as e:
        logging.error(f"JSON decode error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid timestamps format")
    

    if not isinstance(timestamps, dict):
        raise HTTPException(status_code=400, detail="Invalid timestamps format")

    start_times = timestamps.get('start_times')
    end_times = timestamps.get('end_times')

    if not isinstance(start_times, list) or not isinstance(end_times, list):
        raise HTTPException(status_code=400, detail="Timestamps must be lists")

    if len(start_times) != len(end_times):
        raise HTTPException(status_code=400, detail="Start times and end times length mismatch")

    audio_files = {}

    from random import randrange
    job_id = str(randrange(1000000)) #new
    job_storage[job_id] = {} #new
    
    spliced_audio_files = {}
    edited_audio_files = {}

    for file in files:
        try:
            contents = await file.read()
            audio_files[file.filename] = contents
            spliced_audio_files[file.filename] = []
            edited_audio_files[file.filename] = []
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading file {file.filename}: {str(e)}")
    
        for filename, file_content in audio_files.items():
            try:
                audio = AudioSegment.from_file(io.BytesIO(file_content))
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error processing file {filename}: {str(e)}")
            for start_time, end_time in zip(start_times, end_times):
                if isinstance(start_time, int) and isinstance(end_time, int):
                    start_ms = max(start_time, 0)
                    end_ms = max(end_time, 0)
                    if start_ms < end_ms:  
                        segment = audio[start_ms:end_ms]
                        spliced_audio_files[filename].append(segment)
                    else:
                        raise HTTPException(status_code=400, detail="Invalid time range in timestamps")
                else:
                    raise HTTPException(status_code=400, detail="Start times and end times must be integers")
            

        combined = AudioSegment.empty()
        for segment in spliced_audio_files[file.filename]:
            combined += segment

        edited_audio_files[file.filename] = combined

            
        random_id= randrange(1000000)

        name = filename.split('.')[0]
                
        file_path = f"edited_audios/spliced_output_{random_id}.wav"
        combined.export(file_path, format="wav")
            
        #combined.export(f"edited_audios/spliced_output_{random_id}.wav", format="wav")

        job_storage[job_id][file.filename] = file_path #new


        #return {"detail": "Audio files processed and spliced successfully", "file_id": random_id,"file_name": name} 
    return {"detail": "Audio files processed and spliced successfully", "job_id": job_id} #new


@app.get("/download/{job_id}")
async def download_files(job_id: str):
    if job_id not in job_storage:
        raise HTTPException(status_code=404, detail="Job ID not found")
    
    files = job_storage[job_id]
    
    # Create a zip file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for original_filename, file_path in files.items():
            zip_file.write(file_path, original_filename)
    
    zip_buffer.seek(0)
    
    return StreamingResponse(
        zip_buffer,
        media_type='application/zip',
        headers={'Content-Disposition': f'attachment; filename="processed_files_{job_id}.zip"'}
    )
