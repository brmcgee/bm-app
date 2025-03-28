const router = require('express').Router();
const mysql = require('mysql');

router.get('/products', (req, res) => {
    const sql = `SELECT * FROM products`;
    var con = mysql.createConnection(invoice_connect);
    con.connect(function(err){
        if (err) throw err;
        con.query(sql, function(err, result){

            res.json(result)
        })
    }) 
});

router.post('/products', (req, res) => {
    const { item, description, unit, cost, userId } = req.body;
    const sql = `INSERT INTO products (item, description, cost, unit, userId) 
    VALUES ('${item}','${description}','${cost}','${unit}', '${userId}')`;

    console.log(sql)

    var con = mysql.createConnection(invoice_connect);
    con.connect(function(err) {
        if (err) throw err;
                console.log('Connected!');
            
            con.query(sql, function (err, result, fields) {
                if (err) throw err;
                console.log('inserted product!')
                return res.json({'status' : 200, 'message' : result, 'fields' : fields});
            });
    
    });

})




module.exports = router;

