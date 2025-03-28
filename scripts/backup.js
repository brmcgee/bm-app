const path = require('path');
const mysqldump = require('mysqldump')
const fs = require('fs');
const nodemailer = require('nodemailer');


exports.backMysqlInvoice = function(){

    let str = '';
        const now = new Date();
        let filename = ('BRM_' + invoice_connect.database + '_' + (now.getMonth() + 1) + '_' + now.getDate() +  '_' + now.getFullYear()) + '_' + now.getTime()
        let myDateStr = (now.getMonth() + 1) + '-' + now.getDate() +  '-' + now.getFullYear()
        const dirPath = './src/backups';
        const ext = '.sql';
                
            fs.readdir(dirPath, (err, files) => {
                if (err) { 
                      console.log(err) 
                }
                
                if (files.length > 0) {
                        files.forEach(file => {
                
                          const filePath = path.join(dirPath, file)
                          fs.stat(filePath, (err, stats) => {
                            if (err) {
                              console.log(err) 
                              return;
                              }
                            
                              if (stats.isFile() && path.extname(file) === ext) {
                                fs.readFile(filePath, 'utf8', (err, data) => {
                                  if (err) {
                                    console.log(err)
                                    return;
                                  }
                                  // console.log(`The content of ${file}`)
                
                                    fs.unlink(filePath, (err) => {
                                        if (err) {
                                          console.log('Error deleting file...' + err)
                                        }
                
                                        // console.log(`Deleted ${file}`)
                
                                        // back up sql file
                                        mysqldump({
                                          connection: invoice_connect,
                                          dumpToFile: `./src/backups/${filename}.sql`,
                                        });
                                        // console.log(`Back up msql invoice_connect ${filename}`)


                                        var transporter = nodemailer.createTransport({
                                            host: email_host,
                                            port: 465,
                                            secure: true, // true for port 465, false for other ports
                                            auth: {
                                                user: email_user,
                                                pass: email_pass
                                            }
                                        });

                                        const mailOptions = {
                                            from: email_from,
                                            to: email_from,
                                            subject: `Backup Invoice App`,
                                            text: 'Please find the attached file. It includes back up for invoice connect on ' + myDateStr,
                                            attachments: [{
                                                filename: filename + '.sql', // Name the attachment will have when the recipient receives it
                                                path: `./src/backups/${filename}.sql` // Path to the file
                                            }]
                                        };

                                        transporter.sendMail(mailOptions, function(error, info){
                                            if (error) {
                                              console.log(error);
                                            } else {
                                              console.log('Email sent: ' + info.response);

                            
                                            }
                                        });

                                    })
                                  
                                })
                              
                              }
                          })
                
                
                        })
                return true;
            } else {
                let fileNamePath = `./src/backups/${filename}.sql`
                mysqldump({
                    connection: invoice_connect,
                    dumpToFile: `./src/backups/${filename}.sql`,
                });
                return false;
        
            }
                
    })

    
                
}