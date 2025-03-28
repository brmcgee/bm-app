const router = require('express').Router();
const mysql = require('mysql');
const mysqldump = require('mysqldump')
const fs = require('fs');
const path = require('path');



router.get('/expense', (req, res) => {
    const sql = `SELECT * FROM expenses`;
    var con = mysql.createConnection(invoice_connect);
    con.connect(function(err){
        if (err) throw err;
        con.query(sql, function(err, result){
            if (result.length > 0){
                return res.status(200).json(result)
            } else { return res.send('No results')}
            
            
        });

        con.end();
        
    }) 
});

router.post('/add-expense', (req, res) => {
    const { userId, payment, amount, category, date, description, img, payee, type} = req.body;
   
    let result = insertNewExpenseRecord( userId, payment, amount, category, date, description, img, payee, type, mysql)
    
    
                // backup mysql
                // const backupScript = require('../scripts/backup.js');
                // backupScript.backMysqlInvoice()

    res.status(200).json({'status' : 200, 'message' : 'Successfully added expense to db'})
})


module.exports = router;








const expenses = [

    {
        'id' : 0,
        'name' : 'Supplies',
        'values' : ['Supplies & material']
    },
    {
        'id' : 1,
        'name' : 'Vehicle Expenses',
        'values' : ['Vehicle gas & fuel', 'Parking & toll', 'Vehicle insurnace', 'Vehicle registration', 'Vehicle repairs', 'Vehicle services']  
    },
    {
        'id' : 2,
        'name' : 'COGS',
        'values' : ['Cost of labor COG', 'Cost of equipment COG', 'Cost of frieght COG', 'Supplies & material COG']  
    },
    {
        'id' : 3,
        'name' : 'Office Expense',
        'values' : ['Office supplies', 'Printing & Photocopying', 'Shipping & Postage', 'Small tools & Equipment', 'Software & Apps']
    },
    {
        'id' : 4,
        'name' : 'Utilities',
        'values' : ['Disposal & waste fees', 'Electricity', 'Heating & cooling', 'Internet & TV service', 'Phone service', 'Water & sewer']  
    },
    {
        'id' : 5,
        'name' : 'Repairs & maintainence',
        'values' : ['Repair', 'Maintainence']  
    },
    {
        'id' : 6,
        'name' : 'Insurance',
        'values' : ['Business insurance', 'Liability Insurance', 'Property Insurance']  
    },
    {
        'id' : 7,
        'name' : 'General Business Expense',
        'values' : ['Bank fees & service charges', 'Conituing Education', 'Memberships & Subscriptions', 'Uniforms']  
    },
    {
        'id' : 8,
        'name' : 'Legal & accounting services',
        'values' : ['Accounting fees', 'Legal fess']  
    },
    {
        'id' : 9,
        'name' : 'Rent',
        'values' : ['Building & land rent', 'Equipment rental']  
    },
    {
        'id' : 10,
        'name' : 'Taxes paid',
        'values' : ['Payroll taxes', 'Property tax']  
    },
    {
        'id' : 11,
        'name' : 'Travel',
        'values' : ['Airfare', 'Hotels', 'Taxis or shared rides', 'Vehicle rental']  
    },
    {
        'id' : 12,
        'name' : 'Advertising & marketing',
        'values' : ['Listing fees', 'Social media', 'Website Ads']  
    },
    {
        'id' : 13,
        'name' : 'Business License',
        'values' : ['Business License']  
    },
    {
        'id' : 14,
        'name' : 'Payroll expense',
        'values' : ['Offices wages & salaries', 'Salaries & wages']  
    },
    {
        'id' : 15,
        'name' : 'Uncategorized expense',
        'values' : ['Uncategorized']  
    },
    {
        'id' : 16,
        'name' : 'Meals',
        'values' : ['Meals with clients', 'Travel meals']  
    },
    {
        'id' : 17,
        'name' : 'Commission & fees',
        'values' : ['Commission & fees']  
    },
    {
        'id' : 18,
        'name' : 'Contribution to charity',
        'values' : ['Contribution to charity']  
    },
    {
        'id' : 19,
        'name' : 'Contract labor',
        'values' : ['Contract labor']  
    },
    {
        'id' : 20,
        'name' : 'Bad debt',
        'values' : ['Bad debt']  
    },
    {
        'id' : 21,
        'name' : 'Depreciation expense',
        'values' : ['Bad debt']  
    },
    {
        'id' : 22,
        'name' : 'Employee benefits',
        'values' : ['Employee retirement plan', 'Group term life insurance', 'Health insurance & accident plan', 'Officers life insurance', 'Workers compensation insurance']  
    },
    {
        'id' : 23,
        'name' : 'Entertainment',
        'values' : ['Entertainment']  
    },
    {
        'id' : 24,
        'name' : 'Interest paid',
        'values' : ['Business loan interest', 'Credit card interest', 'Mortgage interest']  
    },
    {
        'id' : 25,
        'name' : 'Penalties & Settlements',
        'values' : ['Penalties & Settlements']  
    }
]
let catData = [];
expenses.forEach(exp => {
   let values = exp.values;
   values.forEach(v => {
    catData.push({
                    'catId' : exp.id,
                    'catName' : expenses[exp.id].name,
                    'expense' : v,
                    'amount' : 0,
                    'totalExpenses' : 0
                })

   })
})

function insertNewExpenseRecord (userId, payment, amount, category, date, description, img, payee, type, mysql) {
   

    const sql = `INSERT INTO expenses (userId, payment, amount, category, date, description, img, payee, type) VALUES ('${userId}', '${payment}', '${amount}','${category}','${date}','${description}','${img}','${payee}','${type}')`;
    let i_id;
    var con = mysql.createConnection(invoice_connect);
    con.connect(function(err) {
    if (err) throw err;
            console.log('Connected!');
        
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log('inserted expense!')
            i_id = (result.insertId);
            console.log('inserted id' + i_id)
        });
        
        return false;
    });

    

    return true;
    
}