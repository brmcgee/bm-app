const router = require ('express').Router();
const paymentScript = require('../scripts/payment.js');
const mysql = require('mysql');
const path = require('path');
const mysqldump = require('mysqldump')
const fs = require('fs');


router.get('/payments', (req, res) => {
    const sql = `SELECT * FROM payments`;
    var con = mysql.createConnection(invoice_connect);
    con.connect(function(err){
        if (err) throw err;
        con.query(sql, function(err, result){
            if (result.length > 0){


                return res.json(result)
            } else { return res.send('<h1>No results for payments</h1>')}
            
        })
    }) 
});


router.post('/add-payment', (req, res) => {
    const { phone, email, fullname, userId, vendor, vEmail, invoices, date, note, amount} = req.body;

 
    let result = paymentScript.insertNewPayment(phone, email, fullname, userId, vendor, vEmail, invoices, date, note, amount, mysql)

 
                // backup mysql
                // const backupScript = require('../scripts/backup.js');
                // backupScript.backMysqlInvoice()

    
    res.status(200).json({'status' : 200, 'message' : result, 'invoices' : invoices, 'note' : note, 'vEmail' : vEmail})
})


module.exports = router;


