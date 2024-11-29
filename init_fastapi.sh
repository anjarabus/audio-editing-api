#!/bin/bash

# Activate the virtual environment
source webapi_env/bin/activate

# Change directories
cd FastAPI 

uvicorn main:app --reload

# open a new terminal
#osascript -e 'tell application "Terminal" to do script "echo Hello"'