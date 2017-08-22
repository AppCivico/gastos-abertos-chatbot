FROM node:8.1.4
ENV NPM_CONFIG_LOGLEVEL warn

EXPOSE 8080

USER root
RUN useradd -ms /bin/bash app

RUN apt-get update
RUN apt-get install -y runit

COPY . /src
RUN chown -R app:app /src

WORKDIR /src

USER app
RUN npm install
RUN npm install dotenv sequelize-cli

USER root
COPY services/ /etc/service/
RUN chmod +x /etc/service/*/run



ENTRYPOINT ["runsvdir"]
CMD ["/etc/service/"]
