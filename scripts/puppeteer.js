// const puppeterScipt = require('./scripts/puppeteer.js')
// let invFile = puppeterScipt.invoiceToPdf('SWW6330122', '438', 'src/invoice-uploads/pdf/')
// console.log(invFile)

const mysql = require('mysql');
const { default: puppeteer } = require('puppeteer');
const fs = require('fs');
const nodemailer = require('nodemailer');
const path = require('path');


 const invoiceToPdf = async (po, id, fPath, mess, email, img) => {

    let filename = 'brm_' + id + '_' + po;
    let filePath = fPath + filename;
    let ext = 'pdf';
    let actualFile = filename + '.' + ext

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`${pre}/invoices_slack/${po}`, {
        waitUntil: 'networkidle2',
    });

    // await page.screenshot({
    //   path: `${filePath}.png`,
    //   fullPage: true
    // });

    await page.pdf({
        path: `${filePath}.${ext}`,
        pageRanges: '1-1',
      });
    
    await browser.close();

    let url_link = (filePath.slice(3) + '.' + ext); 
    const invPath = path.join('./src', url_link)
    // urlForInvoicePDF(invPath)

    let attachments = [

        {
            filename: 'brm_' + img,
            path: `src/invoice-uploads/thumbnail/` + img
        },
        {
            filename: actualFile,
            path: invPath
        }
    ]

    emailFile(attachments, mess, 'Invoice from Brian McGee', email, id)
  
 }

function urlForInvoicePDF(url){
    
    const filePath = path.join('./src', url)
    // fs.readFile(filePath, 'utf8', (err, data) => {
    //     if (err) {
    //         console.log(err)
    //         return
    //     }
    //     if (data) {
    //         // have the file do something with it
    //         // emailInvoiceFile(data)

    //     } else {
    //         console.log('No data available')
    //     }


    // })
    console.log(url)
}


function emailFile(attach, textBody, tSubject, email, id){

    var transporter = nodemailer.createTransport(
        {
            host: "mail.boxcar.site",
            port: 465,
            secure: true, // true for port 465, false for other ports
            auth: {
                    user: 'brian@brmnow.com',
                    pass: 'Hannstown548#'
                    }
        });

        const mailOptions = 
            {
                from: '"Brian McGee" <brian@brmnow.com>',
                to: email,
                subject: tSubject + ` #${id}`,
                html: textBody,
                attachments: attach
            };

        transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                        console.log(error);
                } else {
                        console.log('Email sent: ' + info.response);
                        return info.response;
                }
            });    

}

 module.exports = {
    invoiceToPdf
 }
