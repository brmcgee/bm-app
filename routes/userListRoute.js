const router = require ('express').Router();
const mysql = require('mysql');


router.post('/user-list', (req, res) => {
 
    function handlefetchInvoices(){
        var sql = `SELECT * FROM users`;
        var conn = mysql.createConnection(invoice_connect);
        var conn2 = mysql.createConnection(user_list_connect);
        conn.connect(function(err){
            if (err) {
                return res.status(503).json({'message' : 'error in connection', 'error' : err})
            };
    
            conn2.query(sql, function(err, result){
                if (err) {
                    return res.status(401).json({'message' : 'error in query', 'error' : err})
                    // return res.status(401).json({'message' : 'error in query', 'error' : err})
                } 
                else if (req.body.role == 'system' ){ 

                    var sql_user = `SELECT * FROM users WHERE username = '${req.body.username}' AND role = 'system'`;
                    conn2.query(sql_user, function(err){
                        if (err) {
                            return res.status(503).json({'message' : 'Forbidden username or password', 'error' : err})
                        } else {
                            return res.status(200).json(result)
                        }
                    })
                    conn2.end()
                    
                } else {
                    return res.json({'message' : 'Forbidden username or password', 'error' : err, 'status' : 401})
                }
            })
            conn.end()
    
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

    })
});

router.post('/user-profile', (req, res) => {
    const { id, username, email, address, city, phone, fullname} = req.body;
    var conn = mysql.createConnection(user_list_connect);
    var sql = `UPDATE users SET username = '${username}',  email = '${email}', address = '${address}', city = '${city}', phone ='${phone}', name = '${fullname}' WHERE id = '${id}'`
    conn.query(sql, function(err, result){

        console.log(result)
        return res.json(result)
    })
    
})




module.exports = router;