FROM python:3.10-slim

RUN apt-get update && apt-get install -y \
    g++ \
    gcc \
    openjdk-17-jdk-headless \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app