from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import StreamingResponse
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import re
import csv
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

        # logging.info(f"Verify start times: {start_times}")
        # logging.info(f"Verify end times: {end_times}")
    
    return {"extracted_timestamps": tss, "start_times": start_times, "end_times": end_times}


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
    
    for file in files:
        try:
            contents = await file.read()
            audio_files[file.filename] = contents
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading file {file.filename}: {str(e)}")
    
    
    spliced_audio_files = []
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
                    spliced_audio_files.append(segment)
                else:
                    raise HTTPException(status_code=400, detail="Invalid time range in timestamps")
            else:
                raise HTTPException(status_code=400, detail="Start times and end times must be integers")
    

    combined = AudioSegment.empty()
    for segment in spliced_audio_files:
        combined += segment

    from random import randrange
    random_id= randrange(1000000)
    
    combined.export(f"edited_audios/spliced_output_{random_id}.wav", format="wav")

    return {"detail": "Audio files processed and spliced successfully", "file_id": random_id}

@app.get("/download/{random_id}/{file_name}")
async def read_root(random_id: str, file_name:str):
    path = f"edited_audios/spliced_output_{random_id}.wav"
    def iterfile():
            with open(path,"rb") as f:
                yield from f
    return StreamingResponse(iterfile(),headers={'Content-Disposition': f'attachment; filename="{file_name}"'})