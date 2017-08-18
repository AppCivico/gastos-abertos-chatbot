FROM node:8.1.4
ENV NPM_CONFIG_LOGLEVEL warn

EXPOSE 8080

WORKDIR /usr/src/app

COPY package.json .
COPY . .
COPY .env .
COPY .sequelizerc .

RUN npm install -g restify
RUN npm install -g dotenv
RUN npm install -g botbuilder
RUN npm install -g sequelize-cli
RUN npm install