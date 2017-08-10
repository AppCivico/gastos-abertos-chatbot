# specify the node base image with your desired version node:<version>
FROM node:6

# replace this with your application's default port
EXPOSE 8080

VOLUME [ "/usr/src/app" ]

COPY package.json .

RUN npm install -g sequelize-cli
RUN npm install
RUN npm run start:dev