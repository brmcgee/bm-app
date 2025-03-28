const router = require('express').Router();
const mysql = require('mysql');
const customerScript = require('../scripts/customer.js');


router.get('/customers', (req, res) => {
    res.send(`<h2 style="width:100%;background-color:yellow;text-align:center;padding:10px;">Unauthorized Access</h2>`)
});


router.post('/customers', (req, res) => {
    function handlefetchCustomers(){
        var sql = `SELECT * FROM customers`;
        var conn = mysql.createConnection(invoice_connect);
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
                    return res.status(200).json(result)
                } else {
                    return res.json({'message' : 'Forbidden username or password', 'error' : err, 'status' : 401})
                }
            })
            
            conn.end();
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
                handlefetchCustomers();
            } else {
                return res.json({'message' : 'Forbidden username or password', 'error' : err, 'status' : 401})
            }
        })

    })
});

router.post('/add-customer', function (req, res) {

    let { userId, company, address, city, state, zip, phone, email, attn } = req.body;
    let response = customerScript.addCustomerToDb(userId, company, address, city, state, zip, phone, email, attn, mysql);

    console.log(response)
    res.send(true)
})




module.exports = router;