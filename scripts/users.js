const mysql = require('mysql');


exports.updateUserImgDb = function (data, mysql) {
    
    const sql = `UPDATE users SET avatar = '${data.url}' WHERE id = ${data.userId} `;   
    console.log(sql)  
    var con = mysql.createConnection(user_list_connect);
    con.connect(function(err) {
      if (err) throw err;
            
        
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log(result)
            console.log(`Added URL to invoice.`);
            
        });
        con.end();
    });
    return data;
}

