const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const mysqldump = require('mysqldump')

const app = express();

global.PORT = 4300;
const globals = require('../src/globals.js');
app.use('/', globals);

app.use(fileUpload());


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false, limit: '15mb' }));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

app.use('/public/assets', express.static(path.join(__dirname, '/public/public/assets')))
app.use('/invoice-uploads', express.static(path.join(__dirname, 'invoice-uploads')))
app.use('/expense-uploads', express.static(path.join(__dirname, 'expense-uploads')))
app.use('/users', express.static(path.join(__dirname, 'users')))
app.use('/public', express.static(path.join(__dirname, 'invoice-uploads')))
app.use('/favico.ico', express.static(path.join(__dirname, 'public/favico.ico')))

// ==================================================
// const puppeterScipt = require('./scripts/puppeteer.js')
// let invFile = puppeterScipt.invoiceToPdf('SWW6330122', '438', 'src/invoice-uploads/pdf/', 'See attached invoice', 'brianrmcgee@gmail.com', 'th_20250130_125450.jpg')



const homeRoute = require('./routes/homeRoute.js')
app.use('/', homeRoute);

const invoiceRoute = require('./routes/invoiceRoute.js')
app.use('/', invoiceRoute);

const productRoute = require('./routes/productRoute.js')
app.use('/', productRoute);

const customerRoute = require('./routes/customerRoute.js')
app.use('/', customerRoute);

const expenseRoute = require('./routes/expenseRoute.js')
app.use('/', expenseRoute);

const paymentRoute = require('./routes/paymentRoute.js');
app.use('/', paymentRoute);

const utilityRoute = require('./routes/utilityRoute.js');
app.use('/', utilityRoute);

const userListRoute = require('./routes/userListRoute.js');
app.use('/', userListRoute);

app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname,"./public/customers.html"));
    // res.redirect(`${pre}/public/index.html`)
})



app.post('/login', (req, res) => {

    var conn = mysql.createConnection(user_list_connect);
    var username = req.body.username;
    var password = req.body.password;
    var sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    conn.connect(function(err){
        if (err) {
            return res.status(503).json({'message' : 'error in connection', 'error' : err})
        };

        conn.query(sql, function(err, result){
            if (err) {
                return res.status(401).json({'message' : 'error in query', 'error' : err})
                // return res.status(401).json({'message' : 'error in query', 'error' : err})

            } 
            else if (req.body.username  && req.body.password && result[0] ){ 

                let token = [{
                    'id' : result[0].id, 
                    'username' : result[0].username, 
                    'token' : result[0].token, 
                    'role' : result[0].role, 
                    'avatar' : result[0].avatar, 
                    'page' : index_page, 
                    'email' : result[0].email,
                    'address' : result[0].address,
                    'city' : result[0].city,
                    'phone' : result[0].phone,
                    'name' : result[0].name,
                  }]

                return res.status(200).json(token)
            } else {
                return res.json({'message' : 'Forbidden username or password', 'error' : err, 'status' : 401})
            }
        })

    })
});
app.get('/login', (req, res) => {
    res.redirect(`${pre}/public/index.html`)
})



const expenseScript = require('./scripts/expense.js');
app.post('/expense-image-add',  (req, res) => {
  
  let expenseId = req.body.expenseId;
  let sampleFile;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400).send('No files were uploaded.');
    return;
  }

  sampleFile = req.files.sampleFile;
  uploadPath = __dirname + '/expense-uploads/' + sampleFile.name;

  let data;
  sampleFile.mv(uploadPath, function (err) {
    if (err) {
      return res.status(500).send(err);
    }
    data = {
      'url': pre + '/expense-uploads/' + sampleFile.name,
      'host': '/expense-uploads',
      'filename': sampleFile.name,
      'expenseId': expenseId,
    }
    // console.log(data)
    let final = expenseScript.updateExpenseImgDb(data, mysql)
    return res.status(200).send(data)
  })
  

  
})

const invoiceScript = require('./scripts/invoice.js');
app.post('/upload-invoice', function (req, res) {

 
  let keyValue = req.body.keyValue;
  let invoiceId = req.body.invoiceId;

  let sampleFile;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400).send('No files were uploaded.');
    return;
  }

  sampleFile = req.files.sampleFile;
  uploadPath = __dirname + '/invoice-uploads/' + sampleFile.name;

    
  let data;
  sampleFile.mv(uploadPath, function (err) {
    if (err) {
      return res.status(500).send(err);
    }
    data = {
      'url': pre + '/invoice-uploads/' + sampleFile.name,
      'host': '/invoice-uploads',
      'filename': sampleFile.name,
      'invoiceId': invoiceId,
      'th_url': pre + '/invoice-uploads/thumbnail/' + 'th_' + sampleFile.name
    }
    
    let finalResponse = invoiceScript.updateInvoiceImgDb(data, mysql)
    let imageFilename = data.filename;
    let inputFile = __dirname + data.host + '/' + imageFilename;
    let outputFile = __dirname + data.host + '/thumbnail/' + 'th_' + imageFilename

    const sharp = require('sharp');

    async function resizeImage(inputPath, outputPath, width, height) {
      try {
        await sharp(inputPath).resize({ width, height, fit: 'cover' }).toFile(outputPath)
      } catch (error) {
        console.log('error resizing ' + error)
      }
    }
    resizeImage(inputFile, outputFile, 250, 200)

    res.json(data)
  });
});

const usersScript = require('./scripts/users.js');
app.post('/user-img', function (req, res) {

  let keyValue = req.body.keyValue;
  let invoiceId = req.body.invoiceId;

  let sampleFile;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400).send('No files were uploaded.');
    return;
  }

  sampleFile = req.files.sampleFile;
  uploadPath = __dirname + '/users/' + sampleFile.name;

    
  let data;
  sampleFile.mv(uploadPath, function (err) {
    if (err) {
      return res.status(500).send(err);
    }
    data = {
      'url': pre + '/users/' + sampleFile.name,
      'host': '/users',
      'filename': sampleFile.name,
      'userId': invoiceId,
      'th_url': '/users/thumbnail/' + 'th_' + sampleFile.name
    }
    
    let finalResponse = usersScript.updateUserImgDb(data, mysql)
    let imageFilename = data.filename;
    let inputFile = __dirname + data.host + '/' + imageFilename;
    let outputFile = __dirname + data.host + '/thumbnail/' + 'th_' + imageFilename

    const sharp = require('sharp');

    async function resizeImage(inputPath, outputPath, width, height) {
      try {
        await sharp(inputPath).resize({ width, height, fit: 'cover' }).toFile(outputPath)
      } catch (error) {
        console.log('error resizing ' + error)
      }
    }
    resizeImage(inputFile, outputFile, 250, 200)

    res.json(data)
  });
});

// const backupScript = require('../scripts/backup.js');
// backupScript.backMysqlInvoice()
const backupScript = require('./scripts/backup.js');
app.get('/backup', (req, res) => {

  let result = backupScript.backMysqlInvoice()

  let html = `
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
      <body class="bg-secondary-subtle">
      <div class="p-5 bg-info-subtle mx-auto">
        <h4> Database back file sent to ${email_user} ! </h4>
        <a href='https://sv82.ifastnet.com:2096/cpsess5459687114/3rdparty/roundcube/?_task=mail&_mbox=INBOX'> ${email_user} </a>
      </div>
      </body>
  `
  res.send(html)

})



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})

let index_page = '<h1>Welcome B Dizzo</h1>';

