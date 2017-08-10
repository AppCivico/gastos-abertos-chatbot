# specify the node base image with your desired version node:<version>
FROM node:boron
ENV NPM_CONFIG_LOGLEVEL warn

# replace this with your application's default port
EXPOSE 8080

COPY . .

RUN npm install -g sequelize-cli
RUN npm install -g nodemon
RUN npm install
#RUN npm run start:dev
#CMD ["npm", "run", "start:dev"]