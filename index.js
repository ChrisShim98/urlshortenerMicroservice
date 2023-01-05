const UrlValidator = require('./urlvalidator.js');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dns = require('dns');
const mongoUri = "mongodb+srv://chris:chris123@cluster0.ryvhgny.mongodb.net/?retryWrites=true&w=majority";

// Data Base Configuration
mongoose.connect(mongoUri);

const { Schema } = mongoose;

const shortUrlSchema = new Schema({
  url:  String, // String is shorthand for {type: String}
});
const ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({extended: false})); // parse post body

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
    
    if(!new UrlValidator().test(req.body.url))
      return res.json({error : 'invalid url'});
    let domain = new UrlValidator().getDomain(req.body.url);     
    dns.lookup(domain, {all : true}, (err, addresses) => {
      if(err)
        return res.json({error : 'invalid url (dns lookup)'});
      else{
        const shortUrl = new ShortUrl({url: req.body.url});
        shortUrl.save().then(urlSaved => res.json({ original_url: req.body.url, short_url: urlSaved._id}));
      }
    });
});
app.get('/api/shorturl/:shorturl', (req, res) => {
  if(!req.params.shorturl)
      return res.json({error : 'invalid url'});
    
  ShortUrl.findById(req.params.shorturl).exec((err, url) => {
    if(!err && url)
      return res.redirect(url.url);
    return res.json({error : 'invalid url'});
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});