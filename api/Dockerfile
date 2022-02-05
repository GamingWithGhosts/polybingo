FROM python:3.9

WORKDIR /flaskapp
COPY requirements.txt .

RUN apt update && \
        apt install gcc xvfb redis-server wkhtmltopdf -y && \
    pip install -r requirements.txt && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /var/lib/{apt,dpkg,cache,log}/

COPY . .
#ENTRYPOINT [ "python3" ]
CMD sh entrypoint.sh
