express = require 'express'
http = require 'http'

app = express()

app.use express.static "#{__dirname}/public"

app.get '/', (req, res) ->
  res.redirect '/blog/'

app.get '/content/*', (req, res) ->
  res.redirect '/blog/content/' + req.params[0]
app.get '/assets/*', (req, res) ->
  res.redirect '/blog/content/' + req.params[0]

server = http.createServer app
server.listen 8080

console.log 'listening on 8080'


