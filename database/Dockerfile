FROM postgres:15-alpine

ENV POSTGRES_USER=spoved
ENV POSTGRES_PASSWORD=secret
ENV POSTGRES_DB=db

COPY init.sql /docker-entrypoint-initdb.d/01-init.sql

EXPOSE 5432