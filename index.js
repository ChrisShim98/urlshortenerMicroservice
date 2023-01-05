require('dotenv').config();
var express = require('express')
var bodyParser = require('body-parser')
const cors = require('cors');
const app = express();
const dns = require('node:dns');
let mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

/** 2) Create a 'Url' Model */
let counter = 0;

var urlSchema = new mongoose.Schema({
  _id: String,
  url: String
});

var SavedUrl = mongoose.model('Url', urlSchema);

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// URL shortener
// Find and save user
const findUrlByName = (urlName, res) => {
  SavedUrl.find({url: urlName}, function (err, urlFound) {
    if (err) return console.log(err);
    newUrl = new SavedUrl({_id: counter, url: urlName});

    console.log(urlFound);
    if (urlFound != null && urlFound != undefined) {
      if (urlFound.length == 0) {
        newUrl.save(function(err, data) {
          if (err) return console.error(err);
          res.json({ "origin_url": urlName, "short_url": counter });  
          counter += 1;      
        });
      } else {
        res.json({ "origin_url": urlName, "short_url": urlFound[0]._id}); 
      }
    } else {
      res.json({"error": "Wrong format"});
    }
  })
};

// Redirect ---------------------------------
app.get('/api/shorturl/:shortUrls', function(req, res) {
  let testItems = req.url.split('/');
  console.log(testItems[3]);

  SavedUrl.findById({_id: testItems[3]}, function (err, urlFound) {
    if (err) return console.log(err);
    console.log(urlFound);

    if (urlFound != null && urlFound != undefined) {
      if (urlFound.length == 0) {
        res.json({"error": "Wrong format"});
      } else {
        res.redirect(urlFound.url);; 
      }
    } else {
      res.json({"error": "Wrong format"});
    } 
  }) 
});

// Post request -----------------------------
app.post('/api/shorturl', urlencodedParser, function(req, res) {
  if(req.body == null || req.body == undefined) {
    res.json({ error: 'invalid format' });
  } else {
    let testItems = req.body.url.split('//');

    dns.lookup('www.' + testItems[1], (error, address, family) => {
      if (error) {
        console.log(error);
        res.json({ error: 'invalid url' });
      } else {
        findUrlByName(req.body.url, res);
      }
    });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
