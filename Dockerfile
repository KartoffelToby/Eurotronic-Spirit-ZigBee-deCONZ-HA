FROM node:lts-alpine

MAINTAINER Tobias Haber <kontakt@t-haber.de>

RUN mkdir -p /build

WORKDIR /build

COPY . .

RUN npm i && npm run build

FROM node:lts-alpine

ENV NODE_ENV production

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

USER node

RUN npm install

COPY --chown=node:node --from=0 /build/build .

CMD [ "node", "index.js" ]