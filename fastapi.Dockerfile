FROM python:3.12

RUN apt-get -y update 
RUN apt-get -y upgrade
RUN apt-get install -y ffmpeg

WORKDIR /home

COPY ./requirements.txt /home/requirements.txt

RUN pip install -r /home/requirements.txt

# WORKDIR /home/FastAPI

# CMD ["uvicorn", "main:app", "--reload"]