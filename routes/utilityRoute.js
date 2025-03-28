const router = require ('express').Router();
const paymentScript = require('../scripts/payment.js');
const mysql = require('mysql');


router.get('/image-gallery', (req, res) => {
    const sql = `SELECT * FROM invoices`;
    var con = mysql.createConnection(invoice_connect);
    con.connect(function(err){
        if (err) throw err;
        con.query(sql, function(err, result){
            if (result.length > 0){
                let arr = [];
                result.forEach(item => {
                    let prod = JSON.parse(item.fProducts);
                    let p_arr = [];
                    prod.forEach(p => {
                        let obj = {
                            'item' : p.item,
                            'description' : p.description.includes('door') ? p.description : ''
                        }
                        p.description.includes('door') ? p_arr.push(obj) : ''
                        
                    })
                    let obj = {
                        'url' : item.fImg,
                        'type' : item.door,
                        'color' : item.color,
                        'id' : item.invoiceId,
                        'notes' : p_arr

                    }
                    arr.push(obj)
                });
                return res.json(arr)
            } else { return res.send('<h1>No results for payments</h1>')}
            
        })
    }) 
});




module.exports = router;