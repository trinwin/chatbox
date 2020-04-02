var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.Promise = Promise;

var connectionString =
  'mongodb+srv://user:hello@cluster0-yi1dl.gcp.mongodb.net/test?retryWrites=true&w=majority';

var Message = mongoose.model('Message', {
  name: String,
  message: String
});

app.get('/messages', (req, res) => {
  Message.find({}, (err, messages) => {
    res.send(messages);
  });
});

app.get('/messages/:user', (req, res) => {
  var user = req.params.user;
  Message.find({ name: user }, (err, messages) => {
    res.send(messages);
  });
});

app.post('/messages', async (req, res) => {
  try {
    var message = new Message(req.body);
    var savedMessage = await message.save();
    var censored = await Message.findOne({ message: 'badword' });

    if (censored) {
      await Message.deleteOne({ _id: censored.id });
    } else {
      io.emit('message', req.body);
    }

    res.status(200);
  } catch (error) {
    res.sendStatus(500);
    return console.error(error);
  }
});

io.on('connection', socket => {
  console.log('User is connected');
});

// Connect to MongoDB
mongoose
  .connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('MongoDB Connected');
  })
  .catch(err => {
    console.log(`MongoDB Connection Error: ${err.message}`);
  });

// Connect to server
var server = http.listen(3000, () => {
  console.log('server is listening on port ', server.address().port);
});
