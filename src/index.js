const express = require('express');
const bodyParser = require("express");
const NumberValidationService = require('./services/NumberValidationService');
const fs = require('fs');
const fastCsv = require('fast-csv');
const {Client, Contact, LocalAuth} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());
// Allow CORS from all origins
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json());
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

// Create a new client instance
let client;
try {
  client = new Client({
    puppeteer: {
      headless: true,
      noSandbox: true,
    },
    authStrategy: new LocalAuth({
      clientId: "client-one"
    })
  });
} catch (error) {
  console.error('Error initializing client:', error);
}
// When the client is ready, run this code (only once)
client.once('ready', async () => {
  console.log('Client is ready!');
});
// When the client received QR-Code
client.on('qr', (qr) => {
  qrcode.generate(qr, {small: true});
});
// Start your client
client.initialize();

const numberValidationService = new NumberValidationService(client);
app.get('/number-exists/:number', async (req, res) => {
  try {
    const number = req.params.number;
    console.log(`${number} is ${number}\n\n\n`);
    const isUser = await numberValidationService.isNumberInWhatsapp(number);
    res.json({isUser: isUser});
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({error: 'Internal Server Error'});
  }
})

app.get('/validate-csv', async (req, res) => {
  const path = './data/numbers.csv';
  const resultPath = './data/result.csv';
  try {
    const numbers = await numberValidationService.readNumbersFromCSV(path);
    const results = await numberValidationService.validateNumbers(numbers);

    const writeStream = fs.createWriteStream(resultPath, {flags: 'w'});
    const csvStream = fastCsv.format({headers: true});

    csvStream.pipe(writeStream).on('finish', () => {
      console.log('CSV file successfully written.');
    });

    results.forEach(result => {
      csvStream.write(result);
    });

    csvStream.end();
    res.json(results);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({error: 'Internal Server Error'});
  }
});

app.get('/test', (req, res) => {
  res.send('Hello World!');
})
