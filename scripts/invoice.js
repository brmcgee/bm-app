const mysql = require('mysql');


exports.updateInvoiceImgDb = function (data, mysql) {
    
    const sql = `UPDATE invoices SET fImg = '${data.url}' WHERE invoiceId = '${data.invoiceId}' `;   
      
    var con = mysql.createConnection(invoice_connect);
    con.connect(function(err) {
      if (err) throw err;
            
        
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log(`Added URL to invoice.`);
            
        });
        con.end();
    });
    return data;
}

exports.addEmailTimestampDB = function (invoiceId, mysql){
    var datetime = new Date();
    const sql = `UPDATE invoices SET isEmailed = '${datetime}' WHERE invoiceId = '${invoiceId}' `;   
    var con = mysql.createConnection(invoice_connect);
    con.connect(function(err) {
      if (err) throw err;
            
        
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log(`Updated email status.`);
            

            
        });

    });
    return true;
}