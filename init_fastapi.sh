#!/bin/bash

# Activate the virtual environment
source audioapi_env/bin/activate

# Change directories
cd FastAPI 

uvicorn main:app --reload

# open a new terminal
#osascript -e 'tell application "Terminal" to do script "echo Hello"'