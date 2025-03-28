const mysql = require('mysql');

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

exports.insertNewExpenseRecord = function(userId, payment, amount, category, date, description, img, payee, type, mysql) {

    const sql = `INSERT INTO expenses (userId, payment, amount, category, date, description, img, payee, type) VALUES ('${userId}', '${payment}', '${amount}','${category}','${date}','${description}','${img}','${payee}','${type}')`;

    let i_id;
    var con = mysql.createConnection(invoice_connect);
    con.connect(function(err) {
    if (err) throw err;
            console.log('Connected!');
        
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log('inserted customer!')
            i_id = (result.insertId);
        });
        
        return false;
    });
    return true;
    
}
exports.formattedResult = function(data){
    catData.forEach(c => {
        c.amount = 0;
        c.totalExpenses = 0;
        data.forEach(d => {
            if (c.expense == d.type) {      
                c.amount = c.amount + d.amount
                c.totalExpenses = c.totalExpenses + 1
            }
        })
    })
    let catArr = [];
    catData.forEach(x => {
        if (!catArr.includes(x.catName))
            catArr.push(x.catName)
    })
    let catObj = [];
    let catCount = 0;
    catArr.forEach(arr => {
        catObj.push({
            'id' : catCount++,
            'category' : arr,
            'amount' : 0,
            'quantity' : 0
        })
    })
    let qCount = 0;
    data.forEach(cat => {
        console.log(cat.category)
        catObj.forEach(item => {
            if (cat.category == item.id) {
                (item.amount = item.amount + cat.amount)
                item.quantity = item.quantity + 1;
            }
        })
    })

    catData.push(catObj)
    return catData
}



exports.updateExpenseImgDb = function(data, mysql){
    const sql = `UPDATE expenses SET img = '${data.url}' WHERE expenseId = '${data.expenseId}' `;   
      
    var con = mysql.createConnection(invoice_connect);
    con.connect(function(err) {
      if (err) throw err;
            
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log(`Added Img to expense.`);
            con.end();
            return result;
        });
    });
    
    
}