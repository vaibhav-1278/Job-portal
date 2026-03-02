var express = require("express");
var router = express.Router();
var sendMail = require("../mail_sending");
var exe = require("../mysql_conn");
/* GET home page. */



router.get("/", async function (req, res, next) {

    var company_id = req.session.company_id;

    var sql = `
        SELECT 
            SUM(CASE WHEN a.status = 'Shortlisted' THEN 1 ELSE 0 END) AS shortlisted_count,
            SUM(CASE WHEN a.status = 'Pending' THEN 1 ELSE 0 END) AS pending_count,
            SUM(CASE WHEN a.status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_count
        FROM application a
        JOIN jobs j ON a.job_id = j.job_id
        WHERE j.company_id = ?;
    `;

   var sql2 = `
SELECT 
    a.*, 
    j.*, 
    a.status AS application_status,
    j.status AS job_status
FROM application a
JOIN jobs j ON a.job_id = j.job_id
WHERE j.company_id = ?
ORDER BY a.applied_at DESC;
`;
var data = await exe(sql2, [company_id]);
    var result = await exe(sql, [company_id]);
    console.log(data);
    console.log(req.session);

    res.render("company/home.ejs", {
        result: result[0],
        data: data
    });
});

router.get('/company_data',async function(req,res){
    var sql=`SELECT * FROM company WHERE company_id=?`;
    var result=await exe(sql,[req.session.company_id]);
    res.json(result[0]);
});


router.get('/post_new_jobs', function (req, res) {
    res.render('company/post_new_jobs.ejs');
});


router.post('/save_new_jobs', verify_login, async function (req, res) {
    try {
        const d = req.body;

        const sql = `INSERT INTO jobs 
      (job_title, job_description, job_type, experience_min, experience_max, skills, vacancies, salary_range, application_deadline,job_location, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const result = await exe(sql, [
            d.job_title,
            d.job_description,
            d.job_type,
            d.experience_min,
            d.experience_max,
            d.skills,
            d.vacancies,
            d.salary_range,
            d.application_deadline,
            d.job_location,
            req.session.company_id
        ]);

        console.log(result);
        // redirect with message parameter
        res.redirect('/company/view_post_jobs');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

function verify_login(req, res, next) {
    if (req.session.company_id) {
        next();
    } else {
        res.redirect('/');
    }
}

router.get('/view_post_jobs', verify_login, async function (req, res) {

    var sql = `SELECT 
    *,(SELECT COUNT(*) FROM application WHERE application.job_id = jobs.job_id) AS application_count FROM jobs WHERE company_id=?`;
    var result = await exe(sql, [req.session.company_id, req.session.employee_id, req.session.company_id]);
    res.render('company/view_post_jobs.ejs', { jobs: result });
})


router.get('/edit_post_jobs/:job_id', verify_login, async function (req, res) {
    var sql = `SELECT * FROM jobs WHERE job_id=? AND company_id=?`;
    var result = await exe(sql, [req.params.job_id, req.session.company_id]);
    console.log(result);
    res.render('company/edit_post_jobs.ejs', { job: result[0] });
});

router.post('/update_post_jobs', verify_login, async function (req, res) {
    var d = req.body;
    var sql = `UPDATE jobs SET job_title=?,job_description=?,job_type=?,experience_min=?,experience_max=?,skills=?,vacancies=?,salary_range=?,application_deadline=? WHERE job_id=? AND company_id=?`;
    var result = await exe(sql, [d.job_title, d.job_description, d.job_type, d.experience_min, d.experience_max, d.skills, d.vacancies, d.salary_range, d.application_deadline, d.job_id, req.session.company_id]);
    // console.log(result);
    res.redirect('/company/view_post_jobs');
});

router.get('/delete_post_jobs/:job_id', verify_login, async function (req, res) {
    var sql = `DELETE FROM jobs WHERE job_id=? AND company_id=?`;
    var result = await exe(sql, [req.params.job_id, req.session.company_id]);
    res.redirect('/company/view_post_jobs');
});

router.get('/company_profile', verify_login, async function (req, res) {
    var sql = `SELECT * FROM company WHERE company_id=?`;

    var result = await exe(sql, [req.session.company_id]);
    res.render('company/company_profile.ejs', { company: result[0] });
});

router.get('/edit_company_profile', verify_login, async function (req, res) {
    var sql = `SELECT * FROM company WHERE company_id=?`;
    var result = await exe(sql, [req.session.company_id]);
    res.render('company/edit_company_profile.ejs', { company: result[0] });
});

router.post('/update_company_profile', verify_login, async function (req, res) {
    try {
        // 1️⃣ Update logo only if a new file is uploaded
        if (req.files && req.files.company_logo && req.files.company_logo.size > 0) {
            var newname = Date.now() + ".jpg";
            await req.files.company_logo.mv('./public/company_logo/' + newname);

            var sql1 = `UPDATE company SET company_logo=? WHERE company_id=?`;
            await exe(sql1, [newname, req.session.company_id]);
        }

        // 2️⃣ Update other company details
        var d = req.body;
        var sql = `UPDATE company SET company_name=?, company_location=?, company_type=?, industry=?, hr_name=?, hr_designation=?, hr_mobile=?, website_url=?, company_password=?, company_email=?, status=? WHERE company_id=?`;
        await exe(sql, [
            d.company_name,
            d.company_location,
            d.company_type,
            d.industry,
            d.hr_name,
            d.hr_designation,
            d.hr_mobile,
            d.website_url,
            d.company_password,
            d.company_email,
            d.status,
            req.session.company_id
        ]);

        res.redirect('/company/company_profile');
    } catch (err) {
        console.error(err);
    }
});

router.post('/toggle_verify/:company_id', async function (req, res) {
    try {
        const id = req.params.company_id;
        const result = await exe(`SELECT is_verified FROM company WHERE company_id=?`, [id]);

        if (result.length === 0) {
            return res.status(404).send('Company not found');
        }

        const company = result[0]; // first row
        const newStatus = company.is_verified == 1 ? 0 : 1;

        await exe(`UPDATE company SET is_verified=? WHERE company_id=?`, [newStatus, id]);

        res.redirect('/company/company_profile');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


router.get('/applications/:job_id', verify_login, async function (req, res) {
    var sql = `SELECT * FROM jobs WHERE job_id=?`;
    var result = await exe(sql, [req.params.job_id]);

    var sql1 = `
        SELECT * 
        FROM application, employee 
        WHERE application.employee_id = employee.employee_id 
          AND application.job_id = ?
    `;
    var applications = await exe(sql1, [req.params.job_id]);

    console.log(applications);

    res.render('company/applications.ejs', {
        applications: applications,
        job: result[0]
    });
});

router.get('/shortlist_applicant/:application_id', verify_login, async function (req, res) {
    var sql = `UPDATE application SET status='Shortlisted' WHERE application_id=?`;
    var id = req.params.application_id;
    
    var result = await exe(sql, [req.params.application_id]);
    req.session.application_id=id;

   var sql2 = `
  SELECT 
    application.application_id,
    application.applicant_name,
    application.applicant_email,
    jobs.job_title,
    company.company_name,
    employee.employee_email
  FROM application
  JOIN employee ON application.employee_id = employee.employee_id
  JOIN jobs ON application.job_id = jobs.job_id
  JOIN company ON jobs.company_id = company.company_id
  WHERE application.application_id = ?
`;

var result2 = await exe(sql2, [req.params.application_id]);
console.log(result2);

if(result2.length > 0) {
    const candidate = result2[0];

    await sendMail(
        candidate.applicant_email,   // email
        candidate.applicant_name,    // name
        candidate.job_title,
        candidate.company_name       // job title
    );
}
    res.send('<script> window.location.href = document.referrer;</script>');
});

router.get('/reject_applicant/:application_id', verify_login, async function (req, res) {
    var sql = `UPDATE application SET status='Rejected' WHERE application_id=?`;

    var result = await exe(sql, [req.params.application_id]);
    console.log(result);
    sendMail();
    res.send('<script> window.location.href = document.referrer;</script>');
});

//dashbord design
router.get('/all_applications', verify_login, async function (req, res) {
    var sql = `SELECT 
        * FROM application
        WHERE company_id=?`;
    var result = await exe(sql, [req.session.company_id]);
    res.render('company/all_applications.ejs', { applications: result });
});

//logout
router.get('/company_logout', function (req, res) {
    req.session.destroy();
    res.redirect('/');
});





module.exports = router;
// etbj whdd lubf dwaj
