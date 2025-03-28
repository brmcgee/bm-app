const router = require('express').Router();
const path = require('path');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/index.html"));
})


router.get('/public/fonts/ubuntu-regular-webfont.woff', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/fonts/ubuntu-regular-webfont.woff"));
})

router.get('/public/mp4/Captain.America.Brave.New.World.2025.mp4', (req, res) => {
    res.sendFile(path.join(__dirname,"../public//public/mp4/Captain.America.Brave.New.World.2025.mp4"));
})

router.get('/public/css/style.css', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/css/style.css"));
})
router.get('/public/css/fonts.css', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/css/fonts.css"));
})
router.get('/public/css/journal.css', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/css/journal.css"));
})



router.get('/public/js/editInvoiceScripts.js', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/js/editInvoiceScripts.js"));
})
router.get('/public/js/addExpenseRecord.js', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/js/addExpenseRecord.js"));
})
router.get('/public/js/addInvoicePayment.js', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/js/addInvoicePayment.js"));
})
router.get('/public/js/fetchAllInvoices.js', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/js/fetchAllInvoices.js"));
})
router.get('/public/js/fetchInvoiceById_utility.js', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/js/fetchInvoiceById_utility.js"));
})
router.get('/public/js/fetchInvoiceById.js', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/js/fetchInvoiceById.js"));
})
router.get('/public/js/init.js', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/js/init.js"));
})
router.get('/public/js/invoiceAddApp.js', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/js/invoiceAddApp.js"));
})
router.get('/public/js/journal.js', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/js/journal.js"));
})
router.get('/public/js/login.js', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/js/login.js"));
})
router.get('/public/js/toolbar.js', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/js/toolbar.js"));
})
router.get('/public/js/utility.js', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/js/utility.js"));
})
router.get('/public/js/invoiceTemplate.js', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/js/invoiceTemplate.js"));
})
router.get('/public/assets/', (req, res) => {
    res.sendFile(path.join(__dirname,"../public/public/assets/"));
})

module.exports = router;