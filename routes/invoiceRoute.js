const router = require('express').Router();
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const invoiceScript = require('../scripts/invoice.js');
const path = require('path');
const mysqldump = require('mysqldump')
const fs = require('fs');
const { default: puppeteer } = require('puppeteer');


router.post('/invoices', (req, res) => {
 
    function handlefetchInvoices(){
        let user = (req.body.id)
        var sql = `SELECT * FROM invoices WHERE userId = ${user} || 1 ORDER BY fDate DESC `;
        // console.log(sql)
        var conn = mysql.createConnection(invoice_connect);
        var conn2 = mysql.createConnection(user_list_connect);
        conn.connect(function(err){
            if (err) {
                return res.status(503).json({'message' : 'error in connection', 'error' : err})
            };
    
            conn.query(sql, function(err, result){
                if (err) {
                    return res.status(401).json({'message' : 'error in query', 'error' : err})
                    // return res.status(401).json({'message' : 'error in query', 'error' : err})
                } 
                else if (req.body.username ){ 

                    var sql_user = `SELECT * FROM users WHERE username = '${req.body.username}' AND password = '${req.body.token}'`;
                    conn2.query(sql_user, function(err){
                        if (err) {
                            return res.status(503).json({'message' : 'Forbidden username or password', 'error' : err})
                        } else {
                            result.forEach(r => {
                                

                                r.fImg = '/invoice-uploads/' + r.fImg.split('/')[r.fImg.split('/').length-1]
                                r.th_fImg =   '/invoice-uploads/thumbnail/th_' + r.fImg.split('/')[r.fImg.split('/').length-1]
                         
                            })
                            return res.status(200).send(result)
                        }
                    })
                    
                } else {
                    return res.json({'message' : 'Forbidden username or password', 'error' : err, 'status' : 401})
                }

                conn.end();
            })
    
        })
    }

    var conn = mysql.createConnection(user_list_connect);
    let username = (req.body.username);
    var sql = `SELECT * FROM users WHERE username = '${username}'`;
    conn.connect(function(err){
        if (err) {
            return res.status(503).json({'message' : 'error in connection', 'error' : err})
        };

        conn.query(sql, function(err, result){
            if (err) {
                return res.status(401).json({'message' : 'error in query', 'error' : err})
                // return res.status(401).json({'message' : 'error in query', 'error' : err})

            } 
            else if (req.body.username && req.body.token == result[0].token ){ 
                handlefetchInvoices();
            } else {
                return res.json({'message' : 'Forbidden username or password', 'error' : err, 'status' : 401})
            }
        })

        conn.end();

    })
});

router.post('/update-email-ts', (req, res) => {
    let invoiceId = req.body.invoiceId
    var datetime = new Date();
    const sql = `UPDATE invoices SET isEmailed = '${datetime}' WHERE invoiceId = '${invoiceId}' `;   
    var con = mysql.createConnection(invoice_connect);
    con.connect(function(err) {
      if (err) throw err;
            
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log(`Updated email status.`);
            
        });

        con.end();
    });
})

router.get('/invoices/:invoiceId', function (req, res) {
    function getDaysInMonth(month){
        let days = 0;
        if (month == 1) { days = 31 }
        if (month == 2) { days = 28 }
        if (month == 3) { days = 31 }
        if (month == 4) { days = 30 }
        if (month == 5) { days = 31 }
        if (month == 6) { days = 30 }
        if (month == 7) { days = 31 }
        if (month == 8) { days = 31 }
        if (month == 9) { days = 30 }
        if (month == 10) { days = 31 }
        if (month == 11) { days = 30 }
        if (month == 12) { days = 31 }
        return days
    }
    function getDueDate(timestamp){
    
        let date = new Date(timestamp)
        let day = date.getUTCDate();
        let year = date.getFullYear();
        let due = day;
        let da = date.getDay();
        let month = date.getMonth() + 1;
        let actualDay;
        let daysInMonth = getDaysInMonth(month)
        let dueDate = {
            'month' : '',
            'day' : '',
            'year' : '',
            'weekday' : 'Fri',
            'invoiceDate' : `${month}/${day}/${year}`,
            'dueDateString' : function() {
                return `${this.weekday} ${this.month}/${this.day}/${this.year}`
            }
        }
    
        if (da == 0) { actualDay = 'Sun'; due = due + 5}
        if (da == 1) { actualDay = 'Mon'; due = due + 4 + 7}
        if (da == 2) { actualDay = 'Tue'; due = due + 3 + 7 }
        if (da == 3) { actualDay = 'Wen'; due = due + 2 + 7}
        if (da == 4) { actualDay = 'Thur'; due = due + 1 + 7}
        if (da == 5) { actualDay = 'Fri'; due = due + 7}
        if (da == 6) { actualDay = 'Sat'; due = due + 6}
    
        if (due > daysInMonth) {
            if (month == 12) {
                getDaysInMonth(1)
                dueDate.month = 1
                dueDate.year = year + 1
            } else {
                getDaysInMonth(month + 1);
                dueDate.month = month + 1
                dueDate.year = year; 
               
            }
            due = (due - (getDaysInMonth(month)));
        } else if (dueDate.month == '') {
            dueDate.month = month;
            dueDate.year = year; 
        }
    
        dueDate.day = due;
       return(dueDate.dueDateString())
    
    }
    const sql = `SELECT * FROM invoices WHERE invoiceId = '${req.params.invoiceId}'`
    var con = mysql.createConnection(invoice_connect);
    con.connect(function (err) {
        if (err) throw err;
        con.query(sql, function (err, result) {
            result.forEach(r => {
                let img = r.fImg;
                let file = img.split('/')[img.split('/').length - 1];
                r.address2 = r.fCity + ',' + r.fState + ' ' + r.fZip;
                r.dueDate = getDueDate(r.fDate)         
                r.fImg = '/invoice-uploads/' + r.fImg.split('/')[r.fImg.split('/').length-1]
                r.th_fImg =   '/invoice-uploads/thumbnail/th_' + r.fImg.split('/')[r.fImg.split('/').length-1]
                
            })
            res.json(result);
        })
    })
});
router.post('/add-invoice', function (req, res) {


    const { userId, door, color, email, cost, vendorId, fJname, fAddress, fCity, fState, fZip, fPo, fDate, fVendor, fProducts } = req.body;
    const contact = { userId, door, color, email, cost, vendorId, fJname, fAddress, fCity, fState, fZip, fPo, fDate, fVendor, fProducts };


    const sql = `  
    INSERT INTO invoices (userId, door, color, vEmail, cost, vendorId, fJname, fAddress, fCity, fState, fZip, fPo, fDate, fVendor, fProducts, fImg) 
    VALUES ('${contact.userId}', '${contact.door}', '${contact.color}', '${contact.email}','${contact.cost}','${contact.vendorId}','${contact.fJname}','${contact.fAddress}','${contact.fCity}','${contact.fState}','${contact.fZip}','${contact.fPo}','${contact.fDate}','${contact.fVendor}','${contact.fProducts}',
    '${contact.img || 'public/assets/images/placeholder.jpeg'}' ) `;

    var con = mysql.createConnection(invoice_connect);
    con.connect(function (err) {
        if (err) throw err;
        console.log('Connected! -invoices');

        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log('inserted invoice!')
            let id = result.insertId
            const sql2 = `SELECT * FROM invoices WHERE invoiceId = '${id}'`
            var con2 = mysql.createConnection(invoice_connect);
            if (err) throw err;
            console.log('fetched inserted invoice')
            con2.query(sql2, function (err, result, fields) {
                if (err) throw err;
                result.forEach(r => {

                    r.customer = JSON.parse(r.fVendor)
                    r.customer[0].email = r.vEmail;
                    r.address2 = r.fCity + ',' + r.fState + ' ' + r.fZip;
                    r.products = JSON.parse(r.fProducts)
                })

                
                const now = new Date();
                let filename = ('MYSQL_' + invoice_connect.database + '_' + now.getMonth() + '_' + now.getDate() +  '_' + now.getFullYear())
                

                res.json(result)
            })

        });

    });
});
router.get('/invoices_slack/:fPo', function (req, res, next) {
    const sql = `SELECT * FROM invoices WHERE fPo = '${req.params.fPo}'`
    var con = mysql.createConnection(invoice_connect);
    con.connect(function (err) {
        if (err) throw err;
        con.query(sql, function (err, result) {
            if (result.length > 0) {
                result.forEach(r => {

                    r.customer = JSON.parse(r.fVendor)
                    r.customer[0].email = r.vEmail;
                    r.address2 = r.fCity + ',' + r.fState + ' ' + r.fZip;
                    r.products = JSON.parse(r.fProducts)

                    r.fImg = '/invoice-uploads/' + r.fImg.split('/')[r.fImg.split('/').length-1]
                    r.th_fImg =   '/invoice-uploads/thumbnail/th_' + r.fImg.split('/')[r.fImg.split('/').length-1]
             

                })

                let obj = invoiceRecordToHTMLteplate(result)
                return res.status(200).send(obj);
                // return res.json(result)
            } else {

                return res.status(200).json({ 'status': 200, 'message': 'No records for requested query'})
            }
        })

        con.end();
    })

});
router.get('/gen/invoice/:id', function (req, res, next) {
    const sql = `SELECT * FROM invoices WHERE invoiceId = '${req.params.id}'`
    var con = mysql.createConnection(invoice_connect);
    
    con.connect(function (err) {
        if (err) throw err;
        
      

        con.query(sql, function (err, result) {
            if (result.length > 0) {
                result.forEach(r => {

                    r.customer = JSON.parse(r.fVendor)
                    r.customer[0].email = r.vEmail;
                    r.address2 = r.fCity + ',' + r.fState + ' ' + r.fZip;
                    r.products = JSON.parse(r.fProducts)

                    r.fImg = '/invoice-uploads/' + r.fImg.split('/')[r.fImg.split('/').length-1]
                    r.th_fImg =   '/invoice-uploads/thumbnail/th_' + r.fImg.split('/')[r.fImg.split('/').length-1]
             

                })


                  const userSql = `SELECT * FROM users WHERE id = ${result[0].userId}`;
                 

                
                    var userConn = mysql.createConnection(user_list_connect);
                    userConn.connect(function(err){
                        if (err) throw err;
                        userConn.query(userSql, function(err, activeUser){
                            
    
                            let obj = invoiceRecordToHTMLteplate(result, activeUser[0])
                            return res.send(obj);
                            
                        })
                    }) 

                
            } else {

                return res.status(200).json({ 'status': 200, 'message': 'No records for requested query'})
            }
        })
    })

});

router.post('/invoice-sort', function (req, res) {
    
    let { key, value, credentials } = req.body;

    if (credentials.username !== '') {

        // ADD AUTHENICATION FUNCTION
        const sql = `SELECT * FROM invoices WHERE ${key} = '${value}'`

        var con = mysql.createConnection(invoice_connect);
        con.connect(function (err) {
            if (err) throw err;
            con.query(sql, function (err, result) {
                res.json(result);
            })

            con.end();

        })
        console.log('creds')
    } else {
        return res.status(401).send('invalid credentials')
    }

})

router.post('/emailpdf', function (req, res) {
    
    const { phone, fullname, avatar, senderEmail, fPo, vName, vJname, vEmail, invoiceId, cost, thumb, hostPre, status } = req.body;

            let arr = fullname.split(' ');
            let initial = '';
            arr.forEach(a => {
                let str = a.slice(0,1)
                initial += str.toUpperCase()
            })

            const invoiceToPdf = async (po, id, fPath, mess, email, img) => {

                let filename = `brm_` + id + '_' + po;
                let filePath = fPath + filename;
                let ext = 'pdf';
                let actualFile = filename + '.' + ext

                const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
                const page = await browser.newPage();
                
                let gotoLink = `${gotoUrl}${invoiceId}`
  
                await page.goto(gotoLink, {
                    waitUntil: 'networkidle2',
                });

                // await page.screenshot({
                //   path: `${filePath}.png`,
                //   fullPage: true
                // });

                await page.pdf({
                    path: `${filePath}.${ext}`,
                    pageRanges: '1-1',
                });
                
                await browser.close();

                let url_link = (filePath.slice(3) + '.' + ext); 
                const urlPath = path.join('./src/invoice-uploads/thumbnail/', img)
                const invPath = path.join('./src', url_link)
                

                let attachments = [

                    {
                        filename: actualFile,
                        path: invPath
                    },
                    {
                        filename: img,
                        path: urlPath
                    }
                ]

                emailFile(attachments, mess, `Invoice from ${fullname}`, email, id)
            
            }


            function emailFile(attach, textBody, tSubject, email, id){
      
                var transporter = nodemailer.createTransport(
                    {
                        host: email_host,
                        port: 465,
                        secure: true, // true for port 465, false for other ports
                        auth: {
                                user: email_user,
                                pass: email_pass
                                }
                    });
                  
                    const mailOptions = 
                        {
                            from: `${fullname} ` + email_from,
                            replyTo: `${fullname} ${senderEmail}`,
                            // to: 'brianrmcgee@gmail.com',
                            to: vEmail,
                            cc: `${fullname} ${senderEmail}`,
                            subject: fPo + ' ' + tSubject + ` #${id}`,
                            html: textBody,
                            attachments: attach
                        };

                    transporter.sendMail(mailOptions, function(error, info){
                            if (error) {
                                    console.log(error);
                                    return res.json(error)
                            } else {
                                    console.log('Email sent: ' + info.response);
                                    return res.json(info)
                            }
                        });    

            }

  
            let message = `
                <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Invoice - ${vName}</title>

                    </head>
                    <body>
                        <div style="font-family: 'Helvetica Neue', sans-serif; padding:10px;">
                          <message> 

                            <div style="display:flex; align-items:center;">

                            ${status !== 'paid' 

                                ? `<h2 style="margin:0; padding:0; padding-bottom:4px; padding-top:5px; padding-left: 0px; color: rgb(201,8,8); margin-right:5px;">                          
                                     
                                    Invoice ${invoiceId} is now due!

                                    <svg fill="#c90808" height="30px" width="30px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve" stroke="#c90808"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M256,64c-12.8,0-21.333,8.533-21.333,21.333v213.333c0,12.8,8.533,21.333,21.333,21.333 c12.8,0,21.333-8.533,21.333-21.333V85.333C277.333,72.533,268.8,64,256,64z"></path> </g> </g> <g> <g> <path d="M256,170.667c-23.467,0-42.667-12.8-42.667-23.467s19.2-23.467,42.667-23.467c14.933,0,40.533,10.667,49.067,19.2 s21.333,8.533,29.867,0s8.533-21.333,0-29.867c-14.933-17.067-51.2-32-78.933-32c-44.8,0-85.333,25.6-85.333,66.133 S211.2,213.333,256,213.333c23.467,0,42.667,12.8,42.667,23.467c0,10.667-19.2,23.467-42.667,23.467 c-14.933,0-40.533-10.667-49.067-19.2c-8.533-8.533-21.333-8.533-29.867,0c-8.533,8.533-8.533,21.333,0,29.867 c14.933,17.067,53.333,32,78.933,32c44.8,0,85.333-25.6,85.333-66.133S300.8,170.667,256,170.667z"></path> </g> </g> <g> <g> <path d="M320,81.067c-12.8,0-21.333,8.533-21.333,21.333v53.333c0,12.8,8.533,21.333,21.333,21.333s21.333-8.533,21.333-21.333 V102.4C341.333,89.6,332.8,81.067,320,81.067z"></path> </g> </g> <g> <g> <path d="M192,209.067c-12.8,0-21.333,8.533-21.333,21.333v53.333c0,12.8,8.533,21.333,21.333,21.333s21.333-8.533,21.333-21.333 V230.4C213.333,217.6,204.8,209.067,192,209.067z"></path> </g> </g> <g> <g> <path d="M386.133,0H121.6c-19.2,0-36.267,17.067-36.267,38.4v452.267c0,2.133,0,6.4,2.133,8.533 c2.133,4.267,6.4,8.533,10.667,10.667c2.133,2.133,6.4,2.133,8.533,2.133c2.133,0,8.533,0,10.667-2.133 c2.133-2.133,4.267-2.133,6.4-4.267l10.667-10.667l29.867,14.933c6.4,2.133,12.8,2.133,19.2,0l29.867-17.067l34.133,17.067 c6.4,2.133,12.8,2.133,19.2,0L300.8,492.8l34.133,17.067c6.4,2.133,12.8,2.133,19.2,0l25.6-14.933L390.4,505.6 c12.8,12.8,36.267,4.267,36.267-14.933V38.4C422.4,17.067,405.333,0,386.133,0z M379.733,448c-4.267,0-6.4,0-8.533,2.133 L341.333,467.2L307.2,450.133c-6.4-2.133-12.8-2.133-19.2,0L256,467.2l-34.133-17.067c-6.4-2.133-12.8-2.133-19.2,0l-32,17.067 l-34.133-17.067C134.4,448,132.267,448,128,448V42.667h251.733V448z"></path> </g> </g> <g> <g> <path d="M234.667,341.333h-64c-12.8,0-21.333,8.533-21.333,21.333S157.867,384,170.667,384h64c12.8,0,21.333-8.533,21.333-21.333 S247.467,341.333,234.667,341.333z"></path> </g> </g> <g> <g> <path d="M341.333,341.333H320c-12.8,0-21.333,8.533-21.333,21.333S307.2,384,320,384h21.333c12.8,0,21.333-8.533,21.333-21.333 S354.133,341.333,341.333,341.333z"></path> </g> </g> </g></svg>
                                    </h2> `

                                : `<h2 style="margin:0; padding:0; padding-bottom:2px; padding-top:5px; padding-left: 0px; color: #23c918; margin-right:5px;">                          
                                    
                                    Payment has been received!
                                    
                                    <svg height="30px" width="30px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 25.772 25.772" xml:space="preserve" fill="#31c31d" stroke="#31c31d"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path style="fill:#23c918;" d="M25.646,13.74l-1.519-2.396l0.901-2.689c0.122-0.367-0.03-0.77-0.365-0.962l-2.458-1.417l-0.452-2.8 c-0.063-0.382-0.385-0.667-0.771-0.683l-2.835-0.111l-1.701-2.27c-0.232-0.31-0.652-0.413-0.999-0.246l-2.561,1.218l-2.562-1.219 C9.976,0,9.558,0.103,9.325,0.412l-1.701,2.27L4.789,2.793c-0.385,0.015-0.708,0.3-0.77,0.682l-0.452,2.8L1.109,7.692 C0.774,7.884,0.621,8.287,0.743,8.654l0.901,2.689L0.126,13.74c-0.207,0.327-0.154,0.754,0.125,1.022l2.047,1.963l-0.23,2.826 c-0.031,0.387,0.213,0.74,0.584,0.848l2.725,0.785l1.109,2.611c0.152,0.355,0.533,0.561,0.911,0.479l2.78-0.57l2.194,1.797 c0.149,0.121,0.332,0.184,0.515,0.184s0.365-0.063,0.515-0.184l2.194-1.797l2.78,0.57c0.377,0.08,0.76-0.123,0.911-0.479 l1.109-2.611l2.725-0.785c0.371-0.107,0.615-0.461,0.584-0.848l-0.23-2.826l2.047-1.963C25.8,14.494,25.853,14.067,25.646,13.74z M18.763,9.829l-5.691,8.526c-0.215,0.318-0.548,0.531-0.879,0.531c-0.33,0-0.699-0.185-0.934-0.421L7.081,14.22 c-0.285-0.29-0.285-0.76,0-1.05l1.031-1.05c0.285-0.286,0.748-0.286,1.031,0l2.719,2.762l4.484-6.718 c0.225-0.339,0.682-0.425,1.014-0.196l1.209,0.831C18.902,9.029,18.988,9.492,18.763,9.829z"></path> </g> </g></svg>

                                  </h2> `
                            }
                                  
                              
                              
                              
                        
                            </div>
                            
                            <h3 style="margin:0; padding:0; padding-bottom:5px;">Hello ${JSON.parse(vName)[0].name}! </h3>
                            
                            ${status !== 'paid' 

                                ? `The job for ${vJname} - ${fPo} has been completed.  <br>
                                   A balance of $${Number(cost).toFixed(2)} is now due.  <br>
                                   Please see attached invoice.  <br><br>`
                                   
                                : `The billing for ${vJname} - ${fPo} is complete.  <br>
                                   The balance of $${Number(cost).toFixed(2)} for Invoice ${invoiceId} has been paid.  <br>
                                   Please see attached invoice for your reference.  <br><br>`
                            }
                            
                            
                            Thank you   
                            <br> 
                                                                                 
                            <p style="margin:0; padding:0;font-weight:600;">${fullname}</p>
                            <p style="margin:0; padding:0;"> ${phone} </p>
                            <p style="margin:0; padding:0;">${senderEmail} </p>
                                                                  
                            <p style="font-style: italic; padding-top: 11px;">
                            The content of this message is confidential. If you have  <br>
                            received it by mistake, please inform us and then delete  <br>
                            the message. It is forbidden to copy, forward, or in any  <br>
                            way reveal the contents of this message to anyone. The  <br>
                            integrity and security of this email cannot be guaranteed.  <br>  
                            Therefore, the sender will not be held liable for any <br> 
                            damage caused by the message.
                            </p>
                        </message>
                      </div>
                    </body>
                </html>
            `

            
            invoiceToPdf(fPo, invoiceId, 'src/invoice-uploads/pdf/', message, vEmail, thumb)
            // invoiceScript.addEmailTimestampDB(invoiceId, mysql);


   
})

router.post('/email-invoice', function (req, res) {

    const { fPo, vName, vJname, vEmail, invoiceId, cost, thumb, shouldPDF } = req.body;
    const link = `${pre}/invoices_slack/${fPo}`;
    



        var transporter = nodemailer.createTransport({
            host: email_host,
            port: 465,
            secure: true, // true for port 465, false for other ports
            auth: {
                user: email_user,
                pass: email_pass
            }
        });

        // async..await is not allowed in global scope, must use a wrapper
        async function main() {
    

            const info = await transporter.sendMail({
                from: email_from,
                to: `${vEmail}`,
                subject: `INV-${invoiceId} PO-${fPo}/${vJname} for BRM `,
                replyTo: email_reply,
                cc: email_cc,
                text: `<h5>${vName}, INV00${invoiceId} for ${vJname} is ready for payment!</h5>`,
                html:`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - ${vName}</title>

    </head>
    <body>

        <style>
        *{
            font-family: Arial, Helvetica, sans-serif;
        }
        body {
            background-color: #d3d0d0;
        }
        .card{
        padding: 25px;
        border: 2px solid #333;
        border-radius: 15px;
        background-color:#eaeaea;
        }
        .card:hover{
            box-shadow: 0 2px 16px #6e6e6e;
        }
        .link {
            font-size: 18px; display:flex; justify-content: center; align-items: center; text-transform: uppercase; border: 3px solid rgb(14, 81, 157);
                                    text-decoration: none; color:rgb(#0000F5); padding:8px; background-color: #c6d9fb; border-radius: 10px;
        }
        .link:hover {
                box-shadow: 0 2px 11px rgba(30, 30, 146, 0.6);
                color: rgb(6, 37, 113);
                border: 3px solid rgb(157, 155, 14);
                transition: color 1900 ease;
        }
        .icon {
            background-color:  #37dc52; border-radius: 50px; padding: 4px; margin-right: 5px; width: 44px; text-align: center;
        }
        a:hover .icon {
            background-color: rgb(26, 204, 35);
            transition: background-color 500 ease;
        }
            
        </style>
        
    <div  style="display: flex; justify-content: center;">
        <div class="card" >

        <img  src="https://www.brmnow.com/public/assets/logos/bm3.png" 
                alt="b_mcgee" 
                width="82"
                height="67" 
                style=" border-radius: 50%;
                        border: 3px solid #234cb4;
                        padding: 2px; ">
        <br>
        <br>

        <div>
            
            <a href="${link}"  class='link' style=" font-size: 18px; display:flex; justify-content: center; align-items: center; text-transform: uppercase; border: 3px solid rgb(14, 81, 157);
                                    text-decoration: none; color:rgb(#0000F5); padding:6px; background-color: #c6d9fb; border-radius: 10px;" >
                <div class="icon" style=" background-color:  #37dc52; border-radius: 50px; padding: 4px; margin-right: 5px; width: 34px; text-align: center;">
                    <img src="https://www.brmnow.com/public/assets/icons/file-open-blue.png" width="28" 
                    >                    
                </div>
                <span style="font-weight: 800; font-size: larger;">View Invoice</span>

            </a>


        </div>
            
            <h3>
                Invoice #INV00${invoiceId} 
                <br>Job PO: ${fPo} 
                <br>${vJname} 
                <br>
                <br >$${cost} balance is now due. <hr>
                <br>The invoice is ready for payment!
                <br>Please review invoice at attached link.
                <br><a href="${link}" style="padding-top:8px; margin-boytom:2px; font-weight:600px;">${link}</a>

            </h3>
            <hr>
            <h3 style="padding:1px;">${JSON.parse(vName)[0].name}</h3>

            <div style="display: flex; align-items: center;">
                <img src="https://www.brmnow.com/public/assets/logos/brian_mcgee_avatar.png" width="32" height="32" 
                        style="margin-right: 8px; border-radius: 50%; box-shadow: 0 2px 16px #8f8e8e;"/>
                <p style="">Thank you Brian - BRM Contractors</p>
            </div>

            <small>724-787-3758 <br> brian@brmnow.com</small>
        </div>
        </div>
    </div> 
    </body>
    </html>
    `,

            });

            console.log("Message sent: %s", info.messageId);

        }

        main().catch(console.error);
        let respond = invoiceScript.addEmailTimestampDB(invoiceId, mysql);
        if (respond) {
            return res.json( {'email' : vEmail, 'status' : 200, 'message' : 'Email successfully sent'} )
        } else {
            return res.json( {'email' : vEmail, 'status' : 401, 'message' : 'Error occured while sending Email'} )
        }

    

})


router.get('/invoices', (req, res) => {
    // res.sendFile(path.join(__dirname,"./public/index.html"));
    // res.sendFile(path.join(__dirname,"../public/index.html"));
    // res.json({'status' : 401, 'message' : 'unauthorized access'})
    res.status(401).send('<h1 style="background-color:gray;padding:20px;text-align:center;font-family:arial;height:10vh;">Unauthorized Access</h1>')
});

router.post('/update-inv', (req, res) => {
    
    var { invoiceId, userId, fJname, fAddress, fCity, fState, fZip, fPo, fVendor, vEmail, fProducts, cost, timePaid, isEmailed, status, isHide, bmUser} = req.body

    if (!fProducts) { fProducts = [] }
    console.log(isEmailed)
    // if (user = invoice id user) only userid owner can delete invoice
    if (bmUser.id == userId){

        const sql = `UPDATE invoices SET fJname = '${fJname}', fAddress = '${fAddress}', fCity = '${fCity}', fState = '${fState}', fZip = '${fZip}', fPo = '${fPo}', fVendor = '${fVendor}', vEmail = '${vEmail}', fProducts = '${fProducts}', cost = '${cost}', status = '${status}' WHERE invoiceId = '${invoiceId}' `;
        var con = mysql.createConnection(invoice_connect);

     
        con.connect(function (err) {
            if (err) throw err;
            con.query(sql, function (err, result) {
                                   
                res.json({'status' : 200, 'message' : 'pending logic @ backend', 'result' : result})
            })


            con.end();

        })

    }
    
})

router.post('/delete-inv', (req, res) => {
    var invoiceId = req.body.invoiceId;
    var bmuser = req.body.bmuser

        const sql = `DELETE FROM invoices WHERE invoiceId = ${invoiceId}`;
        console.log(sql)
        var con = mysql.createConnection(invoice_connect);

     
        con.connect(function (err) {
            if (err) throw err;
            con.query(sql, function (err, result) {
                if (result){
                   return res.json( { 'status' : 200, 'message' : `Deleted invoice ${invoiceId}`, 'result' : result, 'invoiceId' : invoiceId})
                } else {
                    return res.json( { 'status' : 200, 'message' : 'Hmmm... Toubles deleting invoice ' + invoiceId, 'result' : result, 'invoiceId' : invoiceId})
                }                 

            })


            con.end();

        })

    


})

module.exports = router;








// =========================================
// function scripts
const htmlInvoice = function(data){
    let iDate = new Date(data[0].fDate)
    let day = (iDate.getUTCDay());
    let dayName = '';
    if (day == 0) {dayName = 'Sun'}
    if (day == 1) {dayName = 'Mon'}
    if (day == 2) {dayName = 'Tue'}
    if (day == 3) {dayName = 'Wen'}
    if (day == 4) {dayName = 'Thur'}
    if (day == 5) {dayName = 'Fri'}
    if (day == 6) {dayName = 'Sat'}
    let fDate = dayName + ' ' + (iDate.getMonth() + 1) + '-' + iDate.getUTCDate() + '-' + iDate.getFullYear()
    
    let html = `
<!DOCTYPE html>
<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${JSON.parse(data[0].fVendor)[0].name}</title>

      <link rel="icon" type="image/x-icon" href="https://www.brmnow.com/favico.ico">
   
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <style>
        *{
           
            font-size:14.5px;
            font-weight: 500;
            font-family: "Arial", sans-serif;  
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;


        }
     
        @media print{    
            .no-print, .no-print *
                    {
                        display: none !important;
                    }
        }

        @font-face { 
            font-family: "Ubuntu-Regular";
            font-style: normal;
            font-weight: 500;
            src: 
            url(https://www.bm-app.org/public/fonts/ubuntu-regular-webfont.woff) format("woff2"),
            url(https://www.bm-app.org/public/fonts/ubuntu-regular-webfont.ttf) format("truetype");
        }

        html, body { overflow-x: hidden; overflow-y: auto;} body { position: relative; } 


        * {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            font-style: normal;
            font-family: "Ubuntu", sans-serif;
            font-weight: 500;
            font-family: 'Ubuntu', sans-serif;
        }

    </style>

      `;

    html += `
  </head>
  <body class="px-3 bg-light">
    <section class="py-2 py-md-3">
    <div class="container-lg  bg-white vh-100">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-10 col-xl-9 col-xxl-8">
          <div class="row gy-3 mb-1">
            <div class="col-6">
              <h1 class="text-uppercase m-0 display-5 fw-bold py-2 pt-0 " style="font-family: "Host Grotesk", sans-serif;font-weight:600px;letter-spacing:2px;">
                Invoice
              </h1>
                  <span class="mt-5 fs-4 text-uppercase text-secondary">${data[0].fPo} ${data[0].fJname}</span><br>
                  ${data[0].status == 'paid' 
                    ? `<span class="mt-1 text-uppercase text-success small">Payment ${data[0].timePaid}</span>`
                    : ''
                  }

            </div>
            <div class="col-6">
              <a class="d-block text-end" href="#!">
                <img src="/public/assets/logos/bm_hat.png" class="img-fluid mt-3 p-1 bg-dark rounded-circle" 
                        alt="BRM Logo" width="75" height="75"  style="min-height:75px;min-width:75px;">
              </a>
              <p class="mt-3 text-end">${(data[0].status == 'paid') 
                    ? `<span class="badge fs-2 py-1 px-3 bg-success-subtle border border-3 border-dark text-dark rounded" style="font-family:impact;font-weight:500px;letter-spacing:2px;">PAID</span>` 
                    : `<span class="badeg fs-2 py-1 px-3 bg-danger-subtle border border-3  border-dark text-dark rounded"  style="font-family:impact;font-weight:500px;letter-spacing:2px;">DUE</span>`}
              </p>
            </div>
            <div class="col-12">
                          <div class="float-end">
                    <button class="btn btn-transparent no-print d-flex align-items-center justify-content-end" onclick="window.print()" type="button">
                        Print
                    </button>
                </div>
            
              <h4 class="m-0 p-0 fs-6 fw-bold  text-uppercase">From</h4>
              <address>
                    <div class="d-flex align-items-center">
                        <img src="${pre}/public/assets/icons/account-black.png" width="18" class=" me-1" />
                        <strong class="fw-bold fs-6 me-1">Brian McGee</strong><br>
                  </div>  
                 <img src="${pre}/public/assets/icons/mail-black.png" width="18" class="" /> PO Box 66 Hannastown 15635  <br>
                 <img src="${pre}/public/assets/icons/phone-black.png" width="18" class=""/> (724) 787-3758   <br>
                 <img src="${pre}/public/assets/icons/email-black.png" width="18" class=""> brian@b-mcgee.com 
                 
              </address>


            </div>
          </div>
          <div class="row mb-1">
            <div class="col-12 col-sm-6 col-md-7">
              <h4 class="m-0 p-0 fs-6 fw-bold  text-uppercase">Bill To</h4>
              <address>
                <strong>${JSON.parse(data[0].fVendor)[0].name}</strong><br>
                ${JSON.parse(data[0].fVendor)[0].address}<br>
                ${JSON.parse(data[0].fVendor)[0].city}<br>
                Phone: ${JSON.parse(data[0].fVendor)[0].phone}<br>
                Email: ${data[0].vEmail}
              </address>
            </div>
            <div class="col-12 col-sm-6 col-md-5">

              <h3 class="row">
                <span class="col-5 fs-4">Invoice #</span>
                <span class="col-7 text-sm-end fs-4">${data[0].invoiceId}</span>
              </h3>

              <h5 class="row text-black ">
                <span class="col-5 fs-6">Due date</span>
                <span class="col-7 text-sm-end fs-6 text-${data[0].timePaid != 'false' ? 'success' : 'danger'}">
                    <strong> ${data[0].timePaid != 'false' 
                        ? `PAID IN FULL
                            <svg height="20px" width="20px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 25.772 25.772" xml:space="preserve" fill="#31c31d" stroke="#31c31d"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path style="fill:rgb(0, 183, 79);" d="M25.646,13.74l-1.519-2.396l0.901-2.689c0.122-0.367-0.03-0.77-0.365-0.962l-2.458-1.417l-0.452-2.8 c-0.063-0.382-0.385-0.667-0.771-0.683l-2.835-0.111l-1.701-2.27c-0.232-0.31-0.652-0.413-0.999-0.246l-2.561,1.218l-2.562-1.219 C9.976,0,9.558,0.103,9.325,0.412l-1.701,2.27L4.789,2.793c-0.385,0.015-0.708,0.3-0.77,0.682l-0.452,2.8L1.109,7.692 C0.774,7.884,0.621,8.287,0.743,8.654l0.901,2.689L0.126,13.74c-0.207,0.327-0.154,0.754,0.125,1.022l2.047,1.963l-0.23,2.826 c-0.031,0.387,0.213,0.74,0.584,0.848l2.725,0.785l1.109,2.611c0.152,0.355,0.533,0.561,0.911,0.479l2.78-0.57l2.194,1.797 c0.149,0.121,0.332,0.184,0.515,0.184s0.365-0.063,0.515-0.184l2.194-1.797l2.78,0.57c0.377,0.08,0.76-0.123,0.911-0.479 l1.109-2.611l2.725-0.785c0.371-0.107,0.615-0.461,0.584-0.848l-0.23-2.826l2.047-1.963C25.8,14.494,25.853,14.067,25.646,13.74z M18.763,9.829l-5.691,8.526c-0.215,0.318-0.548,0.531-0.879,0.531c-0.33,0-0.699-0.185-0.934-0.421L7.081,14.22 c-0.285-0.29-0.285-0.76,0-1.05l1.031-1.05c0.285-0.286,0.748-0.286,1.031,0l2.719,2.762l4.484-6.718 c0.225-0.339,0.682-0.425,1.014-0.196l1.209,0.831C18.902,9.029,18.988,9.492,18.763,9.829z"></path> </g> </g></svg>
`
                        : getDueDate(data[0].fDate).dueDateString()}</stong>
                </span>
              </h5>


  
              <div class="row">
                <span class="col-5">Invoice Date</span>
                <span class="col-7 text-sm-end">${fDate}</span>
                <span class="col-5">Jobname</span>
                <span class="col-7 text-sm-end">${data[0].fJname}</span>
                <span class="col-5">Job PO</span>
                <span class="col-7 text-sm-end">${data[0].fPo}</span>
                <span class="col-5">Job Address</span>
                <span class="col-7 text-sm-end">${data[0].fAddress}</span>
                <span class="col-5"></span>
                <span class="col-7 text-sm-end">${data[0].address2}</span>
              </div>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-12">
              <div class="table-responsive">
                <table class="table table-striped mt-2">
                  <thead>
                    <tr>
                      <th scope="col" class="text-uppercase">Qty</th>
                      <th scope="col" class="text-uppercase">Product</th>
                      <th scope="col" class="text-uppercase">Description</th>
                      <th scope="col" class="text-uppercase text-end">Price</th>
                      <th scope="col" class="text-uppercase text-end">Amount</th>
                    </tr>
                  </thead>
                  <tbody class="table-group-divider"> `;

let products = JSON.parse(data[0].fProducts)
products.forEach(p => {
    html += `
                    <tr>
                        <th scope="row">${p.qty}</th>
                        <td>${p.item}</td>
                        <td>${p.description}</td>
                        <td class="text-end">${p.cost / p.qty}</td>
                        <td class="text-end">${p.cost}</td>
                    </tr> `;
});


html += `
                    <tr>
                      <th scope="row" colspan="4" class="text-uppercase text-end">Total Due: </th>
                      <td class="text-end">$

                      ${data[0].status == 'paid' 
                        ? '0.00'
                        : data[0].cost.toFixed(2)
                        
                    }
                      
                      
                      
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>
          </div>

        <div class="row">
            <div class="col-6">

                <a href="${pre + data[0].fImg}" class="text-decoration-none text-black">

                  

                    <figure class="figure">
                        <img src="${pre + data[0].th_fImg}" 
                             class="figure-img img-fluid bg-light" alt="${data[0].fJname}" 
                             style="min-width:210px;max-width:300px;height:165px;min-height:175px;-webkit-filter: grayscale(100%);filter: grayscale(100%);">
                        <figcaption class="figure-caption ">${data[0].door.toUpperCase()} ${data[0].color.toUpperCase()}</figcaption>
                    </figure>

                </a>
                <br>

                <p class="small text-primary m-0 p-0">
                
                ${(data[0].isEmailed != null) 
                    ? `<img src="${pre}/public/assets/icons/email-sent-blue.png" width="18" height="18"> <span style="color:#0000F5;" class="small">${data[0].isEmailed.slice(0,15)}</span>`
                    : ``
                }
                </p>
               

            </div>
                <div class="col-6 text-end d-flex align-items-end justify-content-start flex-column">



                    <br>

                </div>
                                    

            </div>
          </div>
      </div>
    </div>
    </section>
  </body>
  </html>
    `
    return html;
}
function getThumbnailUrl(url) {
    let img = url;
    let file = img.split("/")[img.split("/").length - 1];
           
    let thumb = `/invoice-uploads/thumbnail/th_${file}`;
    return thumb;
}
function getDaysInMonth(month){
        let days = 0;
        if (month == 1) { days = 31 }
        if (month == 2) { days = 28 }
        if (month == 3) { days = 31 }
        if (month == 4) { days = 30 }
        if (month == 5) { days = 31 }
        if (month == 6) { days = 30 }
        if (month == 7) { days = 31 }
        if (month == 8) { days = 31 }
        if (month == 9) { days = 30 }
        if (month == 10) { days = 31 }
        if (month == 11) { days = 30 }
        if (month == 12) { days = 31 }
        return days
}
function getDueDate(timestamp){

    let date = new Date(timestamp)
    let day = date.getUTCDate();
    let year = date.getFullYear();
    let due = day;
    let da = date.getDay();
    let month = date.getMonth() + 1;
    let actualDay;
    let daysInMonth = getDaysInMonth(month)
    let dueDate = {
            'month' : '',
            'day' : '',
            'year' : '',
            'weekday' : 'Fri',
            'invoiceDate' : `${month}/${day}/${year}`,
            'dueDateString' : function() {
                return `${this.weekday} ${this.month}/${this.day}/${this.year}`
            }
    }

    if (da == 0) { actualDay = 'Sun'; due = due + 5}
    if (da == 1) { actualDay = 'Mon'; due = due + 4 + 7}
    if (da == 2) { actualDay = 'Tue'; due = due + 3 + 7 }
    if (da == 3) { actualDay = 'Wen'; due = due + 2 + 7}
    if (da == 4) { actualDay = 'Thur'; due = due + 1 + 7}
    if (da == 5) { actualDay = 'Fri'; due = due + 7}
    if (da == 6) { actualDay = 'Sat'; due = due + 6}
    let dDue = due;
    if (due > daysInMonth) {
            if (month == 12) {
                getDaysInMonth(1)
                dueDate.month = 1
                dueDate.year = year + 1
            } else {
                getDaysInMonth(month + 1);
                dueDate.month = month + 1
                dueDate.year = year; 
            
            }
            due = (due - (getDaysInMonth(month)));
        } else if (dueDate.month == '') {
            dueDate.month = month;
            dueDate.year = year; 
    }


        
    dueDate.day = due;
    return(dueDate)
}
function editDate(ts){

        const date = new Date(ts);
        let day = date.getDate(ts);let month = date.getMonth(ts) + 1;let year = date.getFullYear(ts);let da = date.getDay(ts);let actualDay = '';
        if (da == 0) { actualDay = 'Sun'}
        if (da == 1) { actualDay = 'Mon'}
        if (da == 2) { actualDay = 'Tue'}
        if (da == 3) { actualDay = 'Wen'}
        if (da == 4) { actualDay = 'Thur'}
        if (da == 5) { actualDay = 'Fri'}
        if (da == 6) { actualDay = 'Sat'}
        let formattedDate = `${actualDay} ${month}/${day}/${year}  `

        return formattedDate;
}
  



function invoiceRecordToHTMLteplate(data, user){

    console.log(user)
    // data is a invoice object
    function headTag(title){
        return `
        
        <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice | ${title}</title>
    
        <link rel="icon" type="image/x-icon" href="favico.ico" />
     
    
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    
    </head>
    <body>
    
        `
    }
    function closeTag(){
        return `
        
        <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js" integrity="sha384-I7E8VVD/ismYTF4hNIPjVp/Zjvgyol6VFvRkX/vR+Vc4jQkC+hVqc2pM8ODewa9r" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.min.js" integrity="sha384-0pUGZvbkm6XF6gxjEnlmuGrJXVbNuzT9qBBavbLwCsOGabYfZo0T0to5eqruptLy" crossorigin="anonymous"></script>
    
    </body>
    </html>
        `
    }            
    function editdate2(ts){

            const date = new Date(ts);
            let day = date.getDate(ts);let month = date.getMonth(ts) + 1;let year = date.getFullYear(ts);let da = date.getDay(ts) + 1;let actualDay = '';
            if (da == 0) { actualDay = 'Sun'}
            if (da == 1) { actualDay = 'Mon'}
            if (da == 2) { actualDay = 'Tue'}
            if (da == 3) { actualDay = 'Wen'}
            if (da == 4) { actualDay = 'Thur'}
            if (da == 5) { actualDay = 'Fri'}
            if (da == 6) { actualDay = 'Sat'}
            let formattedDate = `${month}/${day}/${year}  `

            return formattedDate;
    }
    
   
    
    const { userId, door, color, cost, fJname, fAddress, fCity, fState, fZip, fPo, fDate, fVendor, fProducts, timePaid, status, isEmailed, th_fImg, vEmail, dueDate, invoiceId, fImg } = data[0];
    const vendor = JSON.parse(fVendor)[0];
    const products = JSON.parse(fProducts);
    const invoiceDate = editdate2(fDate);

    const imgMaxHeight = '115'
    const invoiceWidth = '890px';
    const logoWidth = '50px'


    const paidPill = `
        <span class="badge bg-success-subtlee text-dark border border-2 border-success float-end rounded-pill py-0 px-1">
            <svg width="25"fill="#088c0a" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#088c0a"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g data-name="Layer 2"> <g data-name="checkmark-circle-2"> <rect width="24" height="24" opacity="0"></rect> <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm4.3 7.61l-4.57 6a1 1 0 0 1-.79.39 1 1 0 0 1-.79-.38l-2.44-3.11a1 1 0 0 1 1.58-1.23l1.63 2.08 3.78-5a1 1 0 1 1 1.6 1.22z"></path> </g> </g> </g></svg>                    
            Paid 
             
        </span>


    `
    const duePill = `
        <span class="badge text-dark float-end rounded-pill py-0 px-1" style="border: 1px solid #aa1818;">
            <svg style="padding:2px;"width="25" fill="#aa1818" height="25" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 493.636 493.636" xml:space="preserve" stroke="#aa1818"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M421.428,72.476C374.868,25.84,312.86,0.104,246.724,0.044C110.792,0.044,0.112,110.624,0,246.548 c-0.068,65.912,25.544,127.944,72.1,174.584c46.564,46.644,108.492,72.46,174.4,72.46h0.58v-0.048 c134.956,0,246.428-110.608,246.556-246.532C493.7,181.12,468,119.124,421.428,72.476z M257.516,377.292 c-2.852,2.856-6.844,4.5-10.904,4.5c-4.052,0-8.044-1.66-10.932-4.516c-2.856-2.864-4.496-6.852-4.492-10.916 c0.004-4.072,1.876-8.044,4.732-10.884c2.884-2.86,7.218-4.511,11.047-4.542c3.992,0.038,7.811,1.689,10.677,4.562 c2.872,2.848,4.46,6.816,4.456,10.884C262.096,370.46,260.404,374.432,257.516,377.292z M262.112,304.692 c-0.008,8.508-6.928,15.404-15.448,15.404c-8.5-0.008-15.42-6.916-15.416-15.432L231.528,135 c0.004-8.484,3.975-15.387,15.488-15.414c4.093,0.021,7.895,1.613,10.78,4.522c2.912,2.916,4.476,6.788,4.472,10.912 L262.112,304.692z"></path> </g> </g> </g></svg>            
            Due
        </span>
    `
    
    // head tag
    let htmlTemplate = headTag(vendor.name);
    
    //styles
    htmlTemplate += `
        <style>

        @font-face { 
            font-family: "Ubuntu-Regular";
            font-style: normal;
            font-weight: 500;
            src: 
            url(${pre}/public/fonts/ubuntu-regular-webfont.woff) format("woff2"),
            url(${pre}/public/fonts/ubuntu-regular-webfont.ttf) format("truetype");
        }

        html, body { overflow-x: hidden; overflow-y: auto;} body { position: relative; } 


        * {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            font-style: normal;
            font-weight: 500;
            font-family: 'Ubuntu', sans-serif;
            font-size:15px;
        }

        body {        
            background-color:rgb(122, 122, 122);
        }
        
        #myImg {
          border-radius: 5px;
          cursor: pointer;
          transition: 0.3s;
        }
        
        #myImg:hover {opacity: 0.7;}
        
        /* The Modal (background) */
        .modal {
          display: none; /* Hidden by default */
          position: fixed; /* Stay in place */
          z-index: 1; /* Sit on top */
          padding-top: 100px; /* Location of the box */
          left: 0;
          top: 0;
          width: 100%; /* Full width */
          height: 100%; /* Full height */
          overflow: auto; /* Enable scroll if needed */
          background-color: rgb(0,0,0); /* Fallback color */
          background-color: rgba(0,0,0,0.9); /* Black w/ opacity */
        }
        
        /* Modal Content (image) */
        .modal-content {
          margin: auto;
          display: block;
          width: 80%;
          max-width: 700px;
        }
        
        /* Caption of Modal Image */
        #caption {
          margin: auto;
          display: block;
          width: 80%;
          max-width: 700px;
          text-align: center;
          color: #ccc;
          padding: 10px 0;
          height: 150px;
        }
        
        /* Add Animation */
        .modal-content, #caption {  
          -webkit-animation-name: zoom;
          -webkit-animation-duration: 0.6s;
          animation-name: zoom;
          animation-duration: 0.6s;
        }
        
        @-webkit-keyframes zoom {
          from {-webkit-transform:scale(0)} 
          to {-webkit-transform:scale(1)}
        }
        
        @keyframes zoom {
          from {transform:scale(0)} 
          to {transform:scale(1)}
        }
        
        /* The Close Button */
        .close {
          position: absolute;
          top: 15px;
          right: 35px;
          color: #f1f1f1;
          font-size: 40px;
          font-weight: bold;
          transition: 0.3s;
        }
        
        .close:hover,
        .close:focus {
          color: #bbb;
          text-decoration: none;
          cursor: pointer;
        }
        
        /* 100% Image Width on Smaller Screens */
        @media only screen and (max-width: 700px){
          .modal-content {
            width: 100%;
          }
        }


        </style>
    `

    //top table
    htmlTemplate += `
    
<div class="mx-auto pt-1" style="max-width:${invoiceWidth};">
<div class="content ">

   
    <div class="container-fluid " >

                     

        <div class="row">
            <div class="col-12">
                <div class="card border rounded-2 my-1" style="min-height:99vh;" >
                    <div class="card-body">

                        

                        <div class="clearfix">
                            <div class="float-start mb-3">
                                <img src="${user.avatar}" alt="dark logo" style="width:${logoWidth};">
                                <span class="fw-bold border-bottom border-dark-subtle text-secondary"> 
                                <small>${user.name} &middot; ${user.email}</small>  </span>
                            </div>
                            <div class="float-end">
                                <h4 class="m-0 d-print-none">
                                Invoice
                                </h4>
                            </div>
                        </div>

                        

                        <div class="row">

                            <div class="col-sm-6">
                                <div class="float-end mt-3">
                                    <p><b>Hello, ${vendor.name}</b></p>
                                    <p class="text-muted fs-13">Please find below details for the recent work completed for ${fJname}. 
                                        Please submit a payment by <strong class="fw-bold">${getDueDate(fDate).dueDateString()}</strong>, and do not hesitate to contact me with any questions.
                                    </p>
                                </div>

                            </div>
                            
                            <div class="col-sm-4 offset-sm-2">
                                <div class="mt-3 float-sm-end">
                                    <p class="fs-13"><strong>Invoice Date: </strong> &nbsp;&nbsp;&nbsp; <span class="float-end">${invoiceDate}</span></p>
                                    <p class="fs-13"><strong>Invoice Status: </strong> ${timePaid == 'false' ? duePill : paidPill} </p>
                                    <p class="fs-13"><strong>Invoice ID: </strong> <span class="float-end">${invoiceId}</span></p>
                                </div>
                            </div>
                        </div>
                       
                        

                        <div class="row mt-4">
                            <div class="col-4">
                                <h6 class="fw-bold">Billing Address</h6>
                                <address>
                                    ${vendor.name}<br>
                                    <small>${vendor.address}</small><br>
                                    ${vendor.city}<br>
                                    <small>${vEmail}</small>
                                </address>
                            </div> 

                            <div class="col-4">
                                <h6 class="fw-bold">Job Address</h6>
                                <address>
                                    ${fJname}<br>
                                    ${fAddress}<br>
                                    ${fCity}, ${fState} ${fZip}<br>
                                    PO ${fPo}
                                </address>
                            </div> 

                            <div class="col-4">
                                <div class="text-sm-end">
                                    <img id="myImg" name="${fImg}" src="${th_fImg}" alt="${fJname}-${door + ' ' +color} door photo." class="img-fluid me-2"  style="max-height: ${imgMaxHeight}px;"/>
                                </div>
                            </div> 
                        </div>    
                             

                        <div class="row">
                            <div class="col-12">
                                <div class="table-responsive">
                                    <table class="table table-sm table-centered table-borderless  mb-0 mt-3" style="cursor:inherit;">
                                        <thead class="border-top border-bottom bg-light-subtle border-dark-subtle">
                                        <tr><th>#</th>
                                            <th>Item</th>
                                            <th>Quantity</th>
                                            <th>Unit Cost</th>
                                            <th class="text-end">Total</th>
                                        </tr></thead>
                                        <tbody>

                        `
                        
                        
    // table rows per products
    let subtotal = 0;
    let balanceDue = 0;
    let count = 1;
    products.forEach(product => {
                
                    let qty = Number(product.qty)
                    let cost = Number(product.cost)
                    let each = cost / qty;
                    
                    subtotal = subtotal + cost;
                    
                    htmlTemplate += `
                                <tr>
                                    <td>${count ++}</td>
                                    <td>
                                            <b>${product.item}</b> <br/>
                                            ${product.description}
                                            
                                    </td>
                                    <td>${qty.toFixed(1)}</td>
                                    <td>${each.toFixed(2)}</td>
                                    <td class="text-end">${cost.toFixed(2)}</td>
                                </tr>
                    
                    `
    });
    (timePaid == 'false' ? balanceDue = cost : balanceDue = 0)

    // end table
    htmlTemplate += `
                                    
                                        </tbody>
                                    </table>
                                </div> 
                            </div> 
                        </div>
                      

                        <div class="row mt-3">
                            <div class="col-sm-6">
                                <div class="clearfix pt-5">
                                    

                                   

                                    ${timePaid == 'false'
                                        ? ` 
                                            <h6 class="fw-bold">Notes:</h6>
                                            <small>
                                                A balance of ${cost.toFixed(2)} is now due! <br>
                                                Invoice ${invoiceId} due on ${getDueDate(fDate).dueDateString()}
                                                <br>
                                            </small>

                                            <br>
                                            
                                            ${isEmailed != null 
                                                ? ` <small class="text-primary">Sent email on ${isEmailed.slice(0,25)} </small>`
                                                : ` <small style="color:purple;">Saved ${editDate(fDate)} </small>`}
                                            
                                            `
                                        : `
                                        <h6 class="fw-bold">Notes:</h6>
                                            <small>
                                                Balance of ${cost.toFixed(2)} has been paid in full. <br>
                                                Thank you ${vendor.name} for your payment. <br>
                                            </small>
                                            <br>

                                            ${isEmailed != null 
                                                ? ` <small class="text-primary">Sent email on ${isEmailed.slice(0,25)} </small>`
                                                : ` <small>Saved ${editDate(fDate)} </small>`}

                                            <br>
                                            
                                            <small>
                                             <span class="text-success">${timePaid}</span>
                                            </small>
                                        <br>

                                        
                                        
                                        `
                                    
                                    }


                                </div>
                            </div>
                            <div class="col-sm-6">
                                <div class="float-end mt-3 mt-sm-0">
                                    <p><b>Total:</b> <span class="float-end">$${subtotal.toFixed(2)}</span></p>
                                    <h3>$${balanceDue.toFixed(2)} USD</h3>
                                </div>
                                <div class="clearfix"></div>
                            </div> 
                        </div>
                       
                        <div class="d-print-none mt-4">
                            <div class="text-end">
                                <a href="javascript:window.print()" class="btn btn-dark"><i class="ri-printer-line"></i> 
                                <svg width="25"viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M5 5C5 4.44772 5.44772 4 6 4H18C18.5523 4 19 4.44772 19 5V11C20.6569 11 22 12.3431 22 14V18C22 19.6569 20.6569 21 19 21H5C3.34314 21 2 19.6569 2 18V14C2 12.3431 3.34315 11 5 11V5ZM5 13C4.44772 13 4 13.4477 4 14V18C4 18.5523 4.44772 19 5 19H19C19.5523 19 20 18.5523 20 18V14C20 13.4477 19.5523 13 19 13V15C19 15.5523 18.5523 16 18 16H6C5.44772 16 5 15.5523 5 15V13ZM7 6V12V14H17V12V6H7ZM9 9C9 8.44772 9.44772 8 10 8H14C14.5523 8 15 8.44772 15 9C15 9.55228 14.5523 10 14 10H10C9.44772 10 9 9.55228 9 9ZM9 12C9 11.4477 9.44772 11 10 11H14C14.5523 11 15 11.4477 15 12C15 12.5523 14.5523 13 14 13H10C9.44772 13 9 12.5523 9 12Z" fill="#ffffff"></path> </g></svg>
                                Print</a>
         
                            </div>
                        </div>   
                       

                    </div> 
                </div> 
            </div>
        </div>
       
        
    </div> 

</div> 
</div>

    
    `

    // img modal 
    htmlTemplate += `
    
    
<div id="myModal" class="modal">
    <span class="close">&times;</span>
    <img class="modal-content" id="img01">
    <div id="caption"></div>
</div>

<script>
    
    var modal = document.getElementById("myModal");
    
    
    var img = document.getElementById("myImg");
    var modalImg = document.getElementById("img01");
    var captionText = document.getElementById("caption");
    img.onclick = function(){
        console.log('click')
      modal.style.display = "block";
      modalImg.src = this.name;
      captionText.innerHTML = this.alt;
    }
    
    
    var span = document.getElementsByClassName("close")[0];
    
   
    span.onclick = function() { 
      modal.style.display = "none";
    }
</script>
    `
    htmlTemplate += closeTag();

    return htmlTemplate;
}