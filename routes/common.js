var express = require("express");
var router = express.Router();
var exe = require("../mysql_conn");
var sendOtpMail = require("../email_otp_send");
const { route } = require("./common");

/* GET home page. */
router.get("/", function (req, res, next) {
    res.render("common/home.ejs");
});

        router.post('/save_company_register', async function(req,res){
            
                var sql = `INSERT INTO company (company_name,company_location,hr_name,hr_designation,hr_mobile,company_email,company_password) VALUES(?,?,?,?,?,?,?)`;
                var result = await exe(sql,[req.body.company_name,req.body.company_location,req.body.hr_name,req.body.hr_designation,req.body.hr_mobile,req.body.company_email,req.body.company_password]);
                console.log(result);
                            res.redirect('/company');

        
        });

router.post('/save_company_login', async function(req,res){
        var sql = `SELECT * FROM company WHERE company_email=? AND company_password=?`;
        var result = await exe(sql,[req.body.company_email,req.body.company_password]);
        console.log(result);
        if(result.length>0){
            req.session.company_id = result[0].company_id;
            res.redirect('/company');
        }else{
            res.redirect('/company_login_again');
        }
});

router.get("/company_login_again", function (req, res) {
    res.render("common/company_login_again.ejs");
});


//employee section start here


router.post('/save_employee', async function(req,res){
    try{
        var sql = `INSERT INTO employee (employee_name,employee_email,employee_mobile,employee_password) VALUES(?,?,?,?)`;
        var result = await exe(sql,[req.body.employee_name,req.body.employee_email,req.body.employee_mobile,req.body.employee_password]);
        console.log(result);
         req.session.employee_id = result.insertId;
        res.redirect('/employees');
    }catch(e){
        res.redirect('/employer_register');
    }
});

router.post('/employee_login', async function(req,res){
    var d = req.body;
    var sql = `SELECT * FROM employee WHERE employee_email=? AND employee_password=?`;
    exe(sql,[d.employee_email,d.employee_password]).then(function(result){
        if(result.length>0){
            req.session.employee_id = result[0].employee_id;
            res.redirect('/employees');
        }else{
            res.redirect('/employee_login_again');
        }
    });
})

router.get("/employee_login_again", function (req, res) {
    res.render("common/employee_login_again.ejs");
});


router.get('/forget_employee_Password',function(req,res){
    res.render('common/forget_employee_Password.ejs');
});

router.post('/send_otp_employee', async function(req,res){

    var sql = `SELECT * FROM employee WHERE employee_email=?`;
    var result = await exe(sql,[req.body.employee_email]);

    if(result.length > 0){

        var otp = Math.floor(1000 + Math.random() * 9000);

        req.session.otp = otp;
        req.session.employee_email = req.body.employee_email;
        req.session.otp_time = Date.now(); // ONLY TIMER ADD

        await sendOtpMail(req.body.employee_email, otp);

        res.render('common/enter_otp_employee.ejs');

    } else {
        res.send("<script>alert('Invalid Email ID'); window.history.back();</script>");
    }
});


router.post('/verify_employee_otp', function(req,res){
    if(req.session.otp == req.body.otp){
        res.render('common/changenew_employee_password.ejs');
    }else{
        // res.send("Invalid OTP");
res.send(`
  <script>
    alert('Invalid OTP');
    window.location.href = '/forget_employee_Password';
  </script>
`);

    }
});


router.post('/set_new_password', async function(req, res) {
    const newPassword = req.body.new_employee_password;
    const confirmPassword = req.body.confirm_employee_password;

    // Update password in database
    try {
        if (newPassword !== confirmPassword) {
            throw new Error("Passwords do not match");
        }
        var sql = `UPDATE employee SET employee_password=? WHERE employee_email=?`;
        await exe(sql, [newPassword, req.session.employee_email]);
res.send(`
  <script>
    alert('successfully reset password');
    window.location.href = '/'
  </script>
`);
        // res.redirect('/employees'); // redirect after success
    } catch (err) {
        console.error(err);
        res.send("Server error. Try again.");
    }
});


//forget comapny password
router.get('/forget_company_Password',function(req,res){
    res.render('common/forget_company_Password.ejs');
});

router.post('/send_otp_company', async function(req,res){

    var sql = `SELECT * FROM company WHERE company_email=?`;
    var result = await exe(sql,[req.body.company_email]);
    if(result.length > 0){

        var otp = Math.floor(1000 + Math.random() * 9000);
        req.session.otp = otp;
        req.session.company_email = req.body.company_email;
        req.session.otp_time = Date.now(); // ONLY TIMER ADD
         
        await sendOtpMail(req.body.company_email, otp);

        res.render('common/enter_otp_company.ejs');

    } else {
        res.send("<script>alert('Invalid Email ID'); window.history.back();</script>");
    }
});

router.post('/verify_company_otp', function(req,res){
    if(req.session.otp == req.body.otp){
        res.render('common/changenew_company_password.ejs');
    }else{
        // res.send("Invalid OTP");
res.send(`
  <script>
    alert('Invalid OTP');
    window.location.href = '/forget_company_Password';
  </script>
`);
    }
});

router.post('/set_newcompany_password',async function(req,res){
    var company_new_password = req.body.new_company_password;
    var company_confirm_password = req.body.confirm_company_password;
    if(company_new_password === company_confirm_password){
        var sql = `UPDATE company SET company_password=? WHERE company_email=?`;
        await exe(sql,[company_new_password,req.session.company_email]);
res.send(`
  <script>
    alert('successfully reset password');
    window.location.href = '/'
  </script>
`);
    }
})

module.exports = router;