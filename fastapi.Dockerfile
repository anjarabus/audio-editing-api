FROM python:3.12

WORKDIR /home

COPY ./requirements.txt /home/requirements.txt

RUN pip install -r /home/requirements.txt

# WORKDIR /home/FastAPI

# CMD ["uvicorn", "main:app", "--reload"]