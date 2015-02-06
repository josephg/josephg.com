# docker build -t josephg/josephg.com .
FROM node

ADD . /app
WORKDIR /app

RUN npm install -g coffee-script
RUN npm install --production

ENV NODE_ENV production

EXPOSE 8080

CMD [ "coffee", "server.coffee" ]

