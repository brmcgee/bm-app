exports.addCustomerToDb = function(userId, company, address, city, state, zip, phone, email, attn, mysql) {

    const sql = `INSERT INTO customers (userId, name, phone, address, city, state, zip, email, attn) VALUES ('${userId}', '${company}','${phone}','${address}','${city}','${state}','${zip}','${email}','${attn}')`;

    var con = mysql.createConnection(invoice_connect);
    con.connect(function(err) {
    if (err) throw err;
            console.log('Connected!');
        
        con.query(sql, function (err, result, fields) {
            if (err) { return err} else {
                return result
            }
            
        });

    });
    
}