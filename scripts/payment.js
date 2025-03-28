const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const { default: puppeteer } = require('puppeteer');



exports.insertNewPayment = function (phone, senderEmail, fullname, userId, vendor, vEmail, invoices, date, note, amount, mysql) {
    
    function editDate(ts) {
        const date = new Date(ts);
        let day = date.getDate(ts); let month = date.getMonth(ts); let year = date.getFullYear(ts); let da = date.getDay(ts); let actualDay = '';
        if (da == 0) { actualDay = 'Sun' }
        if (da == 1) { actualDay = 'Mon' }
        if (da == 2) { actualDay = 'Tue' }
        if (da == 3) { actualDay = 'Wen' }
        if (da == 4) { actualDay = 'Thur' }
        if (da == 5) { actualDay = 'Fri' }
        if (da == 6) { actualDay = 'Sat' }
        let formattedDate = `${actualDay} ${month + 1}/${day}/${year}  `
        return formattedDate;
    }

    const sql = `INSERT INTO payments (invoices, note, amount, userId) VALUES ('${invoices}', '${note}','${amount}', '${userId}')`;
    // console.log(invoices)

    var con = mysql.createConnection(invoice_connect);
    con.connect(function (err) {
        if (err) throw err;
        console.log('Connected!');

        function getInfo(callback) {
            con.query(sql, function (err, result, fields) {
                if (err) throw err;
                console.log('inserted payment!')
 
                return callback(result.insertId)
            });
        }


        //callback to get insert id once ready then proceed -->
        var insertId;
        getInfo(function (result) {
            insertId = result;

            // update db timepaid and notes - invoices marked paid
            updateInvs(insertId)

            // email client invoices have been paid
            // main(insertId).catch(console.error);
            // ===========  OLD MAIL ==========================
        })

        // sql to update each invoice foreach
        function updateInvs(id) {
            let str = `INV-`;
            invoices.forEach(x => {
                str = str + `${x}-`
            })
            str += ` ` + note;
            note += ` #${id}`;

            invoices.forEach(i => {
                const invSql = `UPDATE invoices SET status = 'paid', timePaid = '#${id} ${str} ${new Date().getMonth()+1}/${new Date().getDate()}/${new Date().getFullYear()}' WHERE invoiceId = ${Number(i)} `;

                con.query(invSql, function (err, result, fields) {
                    if (err) throw err;
                    console.log(`Updated invoice status INV${i}. `);
                });

                // ===========================================================================================
                /// get invoice details

                let sql_invoiceRecord = `SELECT * FROM invoices WHERE invoiceId = ${Number(i)}`;
                con.query(sql_invoiceRecord, function(err, result, fields){
                    // console.log('query ql_invoiceR ===============')
                    // console.log(result[0])
                
                        let s_po = result[0].fPo;
                        let s_invoiceId = (Number(i));
                        let s_mess = createMessage(result, fullname, senderEmail, phone);
                        let s_email = result[0].vEmail;
                        // get invoice puppeter
                        invoiceToPdf(s_po, s_invoiceId, s_mess, s_email)
                    
                })

                // ===========================================================================================
            });
        }

    });

    // old mail function 

    var transporter = nodemailer.createTransport({
        host: "mail.boxcar.site",
        port: 465,
        secure: true,
        auth: {
            user: 'brian@brmnow.com',
            pass: 'Hannstown548#'
        }
    });
    async function main(iid) {

        let message = `
    
        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Payment - ${vendor}</title>
    
                        </head>
                        <body>
                            <div style="font-family: 'Helvetica Neue', sans-serif; padding:10px;">
                              <message> 

                                <h2 style="margin:0; padding:0; margin-bottom:2px;">Hello ${vendor}! </h2>
    
                                <div style="display:flex; align-items:center; margin-bottom:4px;">
    
                                      <h2 style="margin:0; padding:0; padding-bottom:2px; padding-top:5px; padding-left: 0px; color: #23c918; margin-right:5px;">                          
                                  Payment ${iid} has been received!
                                      <svg height="30px" width="30px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 25.772 25.772" xml:space="preserve" fill="#31c31d" stroke="#31c31d"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path style="fill:#23c918;" d="M25.646,13.74l-1.519-2.396l0.901-2.689c0.122-0.367-0.03-0.77-0.365-0.962l-2.458-1.417l-0.452-2.8 c-0.063-0.382-0.385-0.667-0.771-0.683l-2.835-0.111l-1.701-2.27c-0.232-0.31-0.652-0.413-0.999-0.246l-2.561,1.218l-2.562-1.219 C9.976,0,9.558,0.103,9.325,0.412l-1.701,2.27L4.789,2.793c-0.385,0.015-0.708,0.3-0.77,0.682l-0.452,2.8L1.109,7.692 C0.774,7.884,0.621,8.287,0.743,8.654l0.901,2.689L0.126,13.74c-0.207,0.327-0.154,0.754,0.125,1.022l2.047,1.963l-0.23,2.826 c-0.031,0.387,0.213,0.74,0.584,0.848l2.725,0.785l1.109,2.611c0.152,0.355,0.533,0.561,0.911,0.479l2.78-0.57l2.194,1.797 c0.149,0.121,0.332,0.184,0.515,0.184s0.365-0.063,0.515-0.184l2.194-1.797l2.78,0.57c0.377,0.08,0.76-0.123,0.911-0.479 l1.109-2.611l2.725-0.785c0.371-0.107,0.615-0.461,0.584-0.848l-0.23-2.826l2.047-1.963C25.8,14.494,25.853,14.067,25.646,13.74z M18.763,9.829l-5.691,8.526c-0.215,0.318-0.548,0.531-0.879,0.531c-0.33,0-0.699-0.185-0.934-0.421L7.081,14.22 c-0.285-0.29-0.285-0.76,0-1.05l1.031-1.05c0.285-0.286,0.748-0.286,1.031,0l2.719,2.762l4.484-6.718 c0.225-0.339,0.682-0.425,1.014-0.196l1.209,0.831C18.902,9.029,18.988,9.492,18.763,9.829z"></path> </g> </g></svg>

                                  </h2> 
                                  
                                  
                                  
                            
                                </div>
                                
                                
                                <br>
                                <p style="margin:0; padding:0;font-weight:600;margin-bottom:3px;"> The following invoice${invoices.length > 1 ? 's' : ''} have been paid:</p>
                                `
                                
    
        invoices.forEach(invId => {
                             message += `
                                    <p style="margin:0; padding:0;font-weight:500;">Invoice ${invId} - ${editDate(date)} </p>
                                    
                            `
                                })
        message += `
                                <p style="margin:0; padding:0;font-weight:400; margin-bottom:6px;">Notes: ${note} </p>
                                <br>
                                Thank you   
                                <br> 
                                
                                                              
                                <p style="margin:0; padding:0;font-weight:600;">Brian McGee</p>
                                <p style="margin:0; padding:0;">(724) 787-3758 </p>
                                <p style="margin:0; padding:0;">brian@brmnow.com </p>
                                                                      
                                <p style="font-style: italic; padding-top: 20px;">
                                The content of this message is confidential. If you have  <br>
                                received it by mistake, please inform us and then delete  <br>
                                the message. It is forbidden to copy, forward, or in any  <br>
                                way reveal the contents of this message to anyone. The  <br>
                                integrity and security of this email cannot be guaranteed.  <br>  
                                Therefore, the sender will not be held liable for any <br> 
                                damage caused by the message.
                                </p>
    
    
                            </message>
                          </div>
                        </body>
                    </html>
        `
    
        
        // send mail with defined transport object
        const info = await transporter.sendMail({
            from: `"${fullname}" ${email_from}`, // sender address
            to: `${vEmail}`,
            subject: `Payment #${iid} recieved - ${fullname}`, // Subject line
            replyTo: `"${fullname}" ${email}`,
            cc: `"${fullname}" ${email}`,
            text: `<h5>${vendor} !, Payment Recieved #${iid}</h5>`, // plain text body
            html: message, 
        });

        console.log("Message sent: %s", info.messageId  + ' Emailed to ' + vEmail);

    }








// =======================================================


const invoiceToPdf = async (po, id, mess, email) => {

    let filename = 'brm_' + id + '_' + po;
    let fPath = `src/invoice-uploads/pdf/`
    let filePath = fPath + filename;
    let ext = 'pdf';
    let actualFile = filename + '.' + ext

    const browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
    const page = await browser.newPage();

    let web_address = (`http://45.77.150.207:4300/invoices_slack/${po}`)
    // web_address = `http://localhost:4300/invoices_slack/${po}`

    let gotoLink = `${gotoUrl}${id}`
    await page.goto(gotoLink, {
        waitUntil: 'networkidle2',
    });

    await page.pdf({
        path: `${filePath}.${ext}`,
        pageRanges: '1-1',
    });
    
    await browser.close();

    let url_link = (filePath.slice(3) + '.' + ext); 
    const invPath = path.join('./src', url_link)
    

    let attachments = [

        {
            filename: actualFile,
            path: invPath
        }
    ]

    emailFile(attachments, mess, 'Invoice payment to ', email, id)

}




function emailFile(attach, textBody, tSubject, email, id){

    var transporter = nodemailer.createTransport(
        {
            host: email_host,
            port: 465,
            secure: true, // true for port 465, false for other ports
            auth: {
                    user: email_user,
                    pass: email_pass
                    }
        });

        const mailOptions = 
            {
                from: `${fullname} ` + email_from,
                replyTo: `${fullname} ${senderEmail}`,
                // to: 'brianrmcgee@gmail.com',
                to: vEmail,
                cc: `${fullname} ${senderEmail}`,
                subject: tSubject + fullname + ' #' + id,
                html: textBody,
                attachments: attach
            };

        transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                        console.log(error);
                        return (error)
                } else {
                        console.log('Email sent: ' + info.response);
                        return (info)
                }
            });    

}

function createMessage(inv, fullname, senderEmail, phone){
    let vName = JSON.parse(inv[0].fVendor);

    let message = `
    <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice - ${vName[0].name}</title>

        </head>
        <body>
            <div style="font-family: 'Helvetica Neue', sans-serif; padding:10px;">
              <message> 

                <div style="display:flex; align-items:center;">

                ${inv[0].status !== 'paid' 

                    ? `<h2 style="margin:0; padding:0; padding-bottom:4px; padding-top:5px; padding-left: 0px; color: rgb(201,8,8); margin-right:5px;">                          
                         
                        Invoice ${inv[0].invoiceId} is now due!

                        <svg fill="#c90808" height="30px" width="30px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve" stroke="#c90808"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M256,64c-12.8,0-21.333,8.533-21.333,21.333v213.333c0,12.8,8.533,21.333,21.333,21.333 c12.8,0,21.333-8.533,21.333-21.333V85.333C277.333,72.533,268.8,64,256,64z"></path> </g> </g> <g> <g> <path d="M256,170.667c-23.467,0-42.667-12.8-42.667-23.467s19.2-23.467,42.667-23.467c14.933,0,40.533,10.667,49.067,19.2 s21.333,8.533,29.867,0s8.533-21.333,0-29.867c-14.933-17.067-51.2-32-78.933-32c-44.8,0-85.333,25.6-85.333,66.133 S211.2,213.333,256,213.333c23.467,0,42.667,12.8,42.667,23.467c0,10.667-19.2,23.467-42.667,23.467 c-14.933,0-40.533-10.667-49.067-19.2c-8.533-8.533-21.333-8.533-29.867,0c-8.533,8.533-8.533,21.333,0,29.867 c14.933,17.067,53.333,32,78.933,32c44.8,0,85.333-25.6,85.333-66.133S300.8,170.667,256,170.667z"></path> </g> </g> <g> <g> <path d="M320,81.067c-12.8,0-21.333,8.533-21.333,21.333v53.333c0,12.8,8.533,21.333,21.333,21.333s21.333-8.533,21.333-21.333 V102.4C341.333,89.6,332.8,81.067,320,81.067z"></path> </g> </g> <g> <g> <path d="M192,209.067c-12.8,0-21.333,8.533-21.333,21.333v53.333c0,12.8,8.533,21.333,21.333,21.333s21.333-8.533,21.333-21.333 V230.4C213.333,217.6,204.8,209.067,192,209.067z"></path> </g> </g> <g> <g> <path d="M386.133,0H121.6c-19.2,0-36.267,17.067-36.267,38.4v452.267c0,2.133,0,6.4,2.133,8.533 c2.133,4.267,6.4,8.533,10.667,10.667c2.133,2.133,6.4,2.133,8.533,2.133c2.133,0,8.533,0,10.667-2.133 c2.133-2.133,4.267-2.133,6.4-4.267l10.667-10.667l29.867,14.933c6.4,2.133,12.8,2.133,19.2,0l29.867-17.067l34.133,17.067 c6.4,2.133,12.8,2.133,19.2,0L300.8,492.8l34.133,17.067c6.4,2.133,12.8,2.133,19.2,0l25.6-14.933L390.4,505.6 c12.8,12.8,36.267,4.267,36.267-14.933V38.4C422.4,17.067,405.333,0,386.133,0z M379.733,448c-4.267,0-6.4,0-8.533,2.133 L341.333,467.2L307.2,450.133c-6.4-2.133-12.8-2.133-19.2,0L256,467.2l-34.133-17.067c-6.4-2.133-12.8-2.133-19.2,0l-32,17.067 l-34.133-17.067C134.4,448,132.267,448,128,448V42.667h251.733V448z"></path> </g> </g> <g> <g> <path d="M234.667,341.333h-64c-12.8,0-21.333,8.533-21.333,21.333S157.867,384,170.667,384h64c12.8,0,21.333-8.533,21.333-21.333 S247.467,341.333,234.667,341.333z"></path> </g> </g> <g> <g> <path d="M341.333,341.333H320c-12.8,0-21.333,8.533-21.333,21.333S307.2,384,320,384h21.333c12.8,0,21.333-8.533,21.333-21.333 S354.133,341.333,341.333,341.333z"></path> </g> </g> </g></svg>
                        </h2> `

                    : `<h2 style="margin:0; padding:0; padding-bottom:2px; padding-top:5px; padding-left: 0px; color: #23c918; margin-right:5px;">                          
                        
                        Payment has been received!
                        
                        <svg height="30px" width="30px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 25.772 25.772" xml:space="preserve" fill="#31c31d" stroke="#31c31d"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path style="fill:#23c918;" d="M25.646,13.74l-1.519-2.396l0.901-2.689c0.122-0.367-0.03-0.77-0.365-0.962l-2.458-1.417l-0.452-2.8 c-0.063-0.382-0.385-0.667-0.771-0.683l-2.835-0.111l-1.701-2.27c-0.232-0.31-0.652-0.413-0.999-0.246l-2.561,1.218l-2.562-1.219 C9.976,0,9.558,0.103,9.325,0.412l-1.701,2.27L4.789,2.793c-0.385,0.015-0.708,0.3-0.77,0.682l-0.452,2.8L1.109,7.692 C0.774,7.884,0.621,8.287,0.743,8.654l0.901,2.689L0.126,13.74c-0.207,0.327-0.154,0.754,0.125,1.022l2.047,1.963l-0.23,2.826 c-0.031,0.387,0.213,0.74,0.584,0.848l2.725,0.785l1.109,2.611c0.152,0.355,0.533,0.561,0.911,0.479l2.78-0.57l2.194,1.797 c0.149,0.121,0.332,0.184,0.515,0.184s0.365-0.063,0.515-0.184l2.194-1.797l2.78,0.57c0.377,0.08,0.76-0.123,0.911-0.479 l1.109-2.611l2.725-0.785c0.371-0.107,0.615-0.461,0.584-0.848l-0.23-2.826l2.047-1.963C25.8,14.494,25.853,14.067,25.646,13.74z M18.763,9.829l-5.691,8.526c-0.215,0.318-0.548,0.531-0.879,0.531c-0.33,0-0.699-0.185-0.934-0.421L7.081,14.22 c-0.285-0.29-0.285-0.76,0-1.05l1.031-1.05c0.285-0.286,0.748-0.286,1.031,0l2.719,2.762l4.484-6.718 c0.225-0.339,0.682-0.425,1.014-0.196l1.209,0.831C18.902,9.029,18.988,9.492,18.763,9.829z"></path> </g> </g></svg>

                      </h2> `
                }
                      
                  
                  
                  
            
                </div>
                
                <h3 style="margin:0; padding:0; padding-bottom:5px;">Hello ${vName[0].name}! </h3>
                
                ${inv[0].status !== 'paid' 

                    ? `The job for ${inv[0].fJname} - ${inv[0].fPo} has been completed.  <br>
                       A balance of $${Number(cost).toFixed(2)} is now due.  <br>
                       Please see attached invoice.  <br><br>`
                       
                    : `The billing for ${inv[0].fJname} - ${inv[0].fPo} is complete.  <br>
                       The balance of $${Number(inv[0].cost).toFixed(2)} for Invoice ${inv[0].invoiceId} has been paid.  <br>
                       Please see attached invoice for your reference.  <br><br>`
                }
                
                
                Thank you   
                <br> 
                                                                     
                <p style="margin:0; padding:0;font-weight:600;">${fullname}</p>
                <p style="margin:0; padding:0;">${phone} </p>
                <p style="margin:0; padding:0;">${senderEmail} </p>
                                                      
                <p style="font-style: italic; padding-top: 11px;">
                The content of this message is confidential. If you have  <br>
                received it by mistake, please inform us and then delete  <br>
                the message. It is forbidden to copy, forward, or in any  <br>
                way reveal the contents of this message to anyone. The  <br>
                integrity and security of this email cannot be guaranteed.  <br>  
                Therefore, the sender will not be held liable for any <br> 
                damage caused by the message.
                </p>
            </message>
          </div>
        </body>
    </html>
`
return message;
}

// ====================================================

    return true;
}
