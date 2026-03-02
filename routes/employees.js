var express = require("express");
var router = express.Router();
var exe = require("../mysql_conn");
const file = require("fileupload/lib/modules/file");

/* GET home page. */
function verify_login(req,res,next){
    if(req.session.employee_id){
        next();
    }else{
        // res.send('<script>alert("Login First");</script>');
        res.redirect('/');
    }
}
router.use(verify_login);



router.get("/",async function (req, res, next) {
    var sql = `SELECT * FROM employee WHERE employee_id=?`;
    var result = await exe(sql,[req.session.employee_id]);
    console.log(result);

    var profile_complete = 0;
    if(result[0].employee_name){
        profile_complete += 12.5;
    }
    if(result[0].employee_email){
        profile_complete += 12.5;
    }
    if(result[0].employee_mobile){
        profile_complete += 12.5;
    }
  
    if(result[0].employee_photo){
        profile_complete += 12.5;
    }
    if(result[0].employee_resume){
        profile_complete += 12.5;
    }
   

    var sql =`SELECT * FROM employee_educations WHERE employee_id=?`;
    var employee_educations = await exe(sql,[req.session.employee_id]);
    if(employee_educations.length>0){
        profile_complete += 50;
    }
    

var sql = `SELECT 
      *, 
      (SELECT COUNT(*) FROM application 
        WHERE application.job_id = jobs.job_id 
        AND application.employee_id = ?) AS application_count,
      (SELECT COUNT(*) FROM saved_jobs 
        WHERE saved_jobs.job_id = jobs.job_id 
        AND saved_jobs.employee_id = ?) AS saved_jobs_count
   FROM jobs, company 
   WHERE jobs.company_id = company.company_id 
   ORDER BY job_id DESC`;

var recent_jobs = await exe(sql, [req.session.employee_id, req.session.employee_id]);

var sql2 = `SELECT * FROM saved_jobs WHERE employee_id = ?`;
var saved_jobs = await exe(sql2, [req.session.employee_id]);
console.log(req.session);
res.render("employees/home.ejs", {
  employee: result[0],
  profile_complete,
  recent_jobs,
  saved_jobs
});
});
router.get('/employee_profile',async function(req,res){
    var sql = `SELECT * FROM employee WHERE employee_id=?`;
    var result = await exe(sql,[req.session.employee_id]);
var profile_complete = 0;
    if(result[0].employee_name){
        profile_complete += 12.5;
    }
    if(result[0].employee_email){
        profile_complete += 12.5;
    }
    if(result[0].employee_mobile){
        profile_complete += 12.5;
    }
      if(result[0].employee_photo){
        profile_complete += 12.5;
    }
    if(result[0].employee_resume){
        profile_complete += 12.5;
    }
   

    var sql =`SELECT * FROM employee_educations WHERE employee_id=?`;
    var employee_educations = await exe(sql,[req.session.employee_id]);
    if(employee_educations.length>0){
        profile_complete += 50;
    }    res.render('employees/employee_profile.ejs',{employee:result[0],profile_complete,employee_educations});
});

router.get('/edit_employee_profile',async function(req,res){
    
    var sql =  `SELECT * FROM employee WHERE employee_id=?`;
    var result = await exe(sql,[req.session.employee_id]);

    var sql1=`SELECT * FROM employee_educations WHERE employee_id=?`;
    var employee_educations = await exe(sql1,[req.session.employee_id]);
    console.log(result);

    res.render('employees/edit_employee_profile.ejs',{employee:result[0],employee_educations});
});

router.post('/update_employee_profile', async function(req, res) {
  try {
    // Check if session employee_id exists
    if (!req.session.employee_id) {
      console.log("Session Employee ID not found");
      return res.redirect('/login'); // किंवा suitable page
    }

    // Profile Photo
    if (req.files && req.files.employee_profile_photo && req.files.employee_profile_photo.size > 0) {
      var newname = Date.now() + ".jpg";
      await req.files.employee_profile_photo.mv('./public/employee_photo/' + newname);
      var sql1 = `UPDATE employee SET employee_profile_photo=? WHERE employee_id=?`;
      await exe(sql1, [newname, req.session.employee_id]);
    }

    // Resume
    if (req.files && req.files.employee_resume && req.files.employee_resume.size > 0) {
      var newname = Date.now() + ".pdf";
      await req.files.employee_resume.mv('./public/employee_resume/' + newname);
      var sql1 = `UPDATE employee SET employee_resume=? WHERE employee_id=?`;
      await exe(sql1, [newname, req.session.employee_id]);
    }

    var d = req.body;

    var sql = `
      UPDATE employee SET 
      employee_name=?, 
      employee_mobile=?, 
      employee_alternate_mobile=?, 
      employee_email=?,
      employee_dob=?, 
      employee_gender=?, 
      employee_marital_status=?, 
      employee_address=?, 
      employee_pincode=?, 
      employee_current_designation=?,
      employee_experience_years=?, 
      employee_current_salary=?, 
      employee_expected_salary=?, 
      employee_preferred_job_type=?,
      employee_preferred_locations=?, 
      employee_skills_summary=?, 
      employee_languages_known=?, 
      employee_linkedin_url=?, 
      employee_github_url=?,
      employee_portfolio_url=?
      WHERE employee_id=?
    `;

    var result = await exe(sql, [
      d.employee_name || null,
      d.employee_mobile || null,
      d.employee_alternate_mobile || null,
      d.employee_email || null,
      d.employee_dob || null,
      d.employee_gender || null,
      d.employee_marital_status || null,
      d.employee_address || null,
      d.employee_pincode || null,
      d.employee_current_designation || null,
      d.employee_experience_years || null,
      d.employee_current_salary || null,
      d.employee_expected_salary || null,
      d.employee_preferred_job_type || null,
      d.employee_preferred_locations || null,
      d.employee_skills_summary || null,
      d.employee_languages_known || null,
      d.employee_linkedin_url || null,
      d.employee_github_url || null,
      d.employee_portfolio_url || null,
      req.session.employee_id
    ]);

    res.redirect('/employees/employee_profile');
  } catch(err) {
    console.log("Update Employee Profile Error:", err);
  }
});

router.post('/save_employee_education',async function (req, res) {
    var sql = `INSERT INTO employee_educations (employee_id, college_name, course_title, passing_year, marks, status) VALUES (?,?,?,?,?,?)`;
    var result  = await exe(sql,[req.session.employee_id,req.body.college_name,req.body.course_title,req.body.passing_year,req.body.marks,req.body.status]);
  res.redirect('/employees/employee_profile');
});

router.get('/edit_education/:education_id',async function(req,res){
    var sql = `SELECT * FROM employee_educations WHERE education_id=?`;
    var result = await exe(sql,[req.params.education_id]);
      var employeeData = await exe(`SELECT * FROM employee WHERE employee_id=?`, [req.session.employee_id]);
    console.log(result);
    res.render('employees/edit_education.ejs',{education:result[0],employee: employeeData[0]});
});

router.post('/update_employee_education', async function (req, res) {
  var d = req.body;
  var sql = `
    UPDATE employee_educations 
    SET college_name=?, course_title=?, passing_year=?, marks=?, status=? 
    WHERE education_id=? AND employee_id=?`;
  
  await exe(sql, [
    d.college_name,
    d.course_title,
    d.passing_year,
    d.marks,
    d.status,
    d.education_id,
    req.session.employee_id
  ]);

  res.redirect('/employees/employee_profile');
});


router.post('/update_employee_resume', async function(req, res) {
  
    if(req.files && req.files.resume_file && req.files.resume_file.size > 0){
        var newname = Date.now() + ".pdf";
        await req.files.resume_file.mv('./public/employee_resume/' + newname);
        var sql1 = `UPDATE employee SET employee_resume=? WHERE employee_id=?`;
        await exe(sql1, [newname, req.session.employee_id]);
    }
    // res.redirect('/employees/employee_profile');
    res.send("<script>alert('Resume Updated Successfully'); window.location='/employees/employee_profile';</script>");
  });



router.get('/delete_education/:education_id',async function(req,res){
    var sql = `DELETE FROM employee_educations WHERE education_id=? AND employee_id=?`;
    await exe(sql,[req.params.education_id,req.session.employee_id]);
    res.redirect('/employees/employee_profile');
});

router.get('/save_job/:job_id', async function(req, res) {
  var job_id = req.params.job_id;
  var employee_id = req.session.employee_id;
  // आधी job save आहे का तपास
    var employeeData = await exe(`SELECT * FROM employee WHERE employee_id=?`, [req.session.employee_id]);
  var check = await exe("SELECT * FROM saved_jobs WHERE employee_id=? AND job_id=?", [employee_id, job_id]);
  if (check.length == 0) {
    await exe("INSERT INTO saved_jobs (employee_id, job_id) VALUES (?,?)", [employee_id, job_id]);
res.send("<script>window.location = document.referrer;</script>");
  } else {
res.send("<script>window.location = document.referrer;</script>");
  }
});


router.get('/view_saved_jobs', async function(req, res) {
  var sql = `SELECT jobs.*,company.* 
             FROM saved_jobs,jobs,company 
             WHERE saved_jobs.employee_id=? 
             AND saved_jobs.job_id=jobs.job_id 
             AND jobs.company_id=company.company_id`;
  var saved_jobs = await exe(sql,[req.session.employee_id]);

  // ✅ Add this line to fetch employee data
  var employeeData = await exe(`SELECT * FROM employee WHERE employee_id=?`, [req.session.employee_id]);

  // ✅ Pass employee in render
  res.render('employees/view_saved_jobs.ejs', {
    saved_jobs,
    employee: employeeData[0]   // <--- this fixes ReferenceError
  });
});

router.get('/unsave_job/:job_id',async function(req,res){
    var sql = `DELETE FROM saved_jobs WHERE job_id=? AND employee_id=?`;
    await exe(sql,[req.params.job_id,req.session.employee_id]);
    res.redirect('/employees/view_saved_jobs');
});


router.get('/job_details/:job_id',async function(req,res){
    var sql = `SELECT jobs.*,company.* FROM jobs,company WHERE jobs.job_id=? AND jobs.company_id=company.company_id`;
    var result = await exe(sql,[req.params.job_id]);
      var employeeData = await exe(`SELECT * FROM employee WHERE employee_id=?`, [req.session.employee_id]);
    res.render('employees/job_details.ejs',{job:result[0], employee: employeeData[0]});
});

// Apply jobs
router.post('/apply_job/', async function(req, res) {
  var d = req.body;
    var job_id = req.body.job_id;
    var employee_id = req.session.employee_id;
    var company_id=req.session.company_id;
    var file_name = Date.now() + ".pdf";
    req.files.applicant_resume_file.mv('./public/employee_resume/' + file_name);
var sql = `INSERT INTO application (job_id,company_id, employee_id, applicant_name, applicant_email, applicant_resume_file) VALUES (?,?,?,?,?,?)`;
var data = await exe(sql,[job_id,company_id, employee_id, d.applicant_name, d.applicant_email, file_name]);
 res.redirect('/employees/all_jobs');
      //  res.redirect('/employees/all_jobs');

    // res.send(file_name);
});

router.get('/all_jobs',async function(req,res){
        var employeeData = await exe(`SELECT * FROM employee WHERE employee_id=?`, [req.session.employee_id]);
       var id = req.session.employee_id;
var sql = `
SELECT *,
(SELECT COUNT(*) FROM application WHERE application.job_id = jobs.job_id AND application.employee_id = ${id}) AS application_count,
(SELECT COUNT(*) FROM saved_jobs WHERE saved_jobs.job_id = jobs.job_id AND saved_jobs.employee_id = ${id}) AS saved_jobs_count
FROM jobs, company WHERE jobs.company_id = company.company_id ORDER BY jobs.job_id DESC
`;
var jobData = await exe(sql);
    res.render('employees/all_job.ejs',{jobs:jobData, employee: employeeData[0]});

})


router.get('/apply_job_details/:job_id', async function(req, res) {
  var id = req.params.job_id;

  var sql = `SELECT *,
      (SELECT COUNT(*) FROM application 
          WHERE application.job_id = jobs.job_id 
          AND application.employee_id = ${req.session.employee_id}
      ) AS application_count,

      (SELECT COUNT(*) FROM saved_jobs 
          WHERE saved_jobs.job_id = jobs.job_id 
          AND saved_jobs.employee_id = ${id}
      ) AS saved_jobs_count,

      jobs.*, company.*
    FROM jobs, company 
    WHERE jobs.job_id=? 
    AND jobs.company_id=company.company_id`;

  var result = await exe(sql, [req.params.job_id]);

  var employeeData = await exe(`SELECT * FROM employee WHERE employee_id=?`, 
    [req.session.employee_id]
  );

  res.render('employees/job_details.ejs', { 
    job: result[0], 
    employee: employeeData[0] 
  });
});

//employee application history
router.get('/my_applications',async function(req,res){
var sql = `SELECT * FROM application,jobs,company WHERE application.employee_id=? 
AND application.job_id=jobs.job_id AND jobs.company_id=company.company_id ORDER BY 
application.application_id DESC`;
var sql1 = `SELECT * FROM application WHERE application.employee_id=? ORDER BY 
application.application_id DESC`;
var ap_data = await exe(sql1,[req.session.employee_id]);
var result = await exe(sql,[req.session.employee_id]);
var employeeData = await exe(`SELECT * FROM employee WHERE employee_id=?`, [req.session.employee_id]);
res.render('employees/my_applications.ejs',{applications:result, employee: employeeData[0],ap_data:ap_data});
});

router.get('/application_details/:job_id',async function(req,res){
    var sql = `SELECT * FROM application,jobs,company WHERE application.employee_id=? 
    AND application.job_id=? AND application.job_id=jobs.job_id AND jobs.company_id=company.company_id`;
    var result = await exe(sql,[req.session.employee_id,req.params.job_id]);
    var employeeData = await exe(`SELECT * FROM employee WHERE employee_id=?`, [req.session.employee_id]);
    res.render('employees/application_details.ejs',{application:result[0], employee: employeeData[0]});
});


router.get('/employee_logout',function(req,res){
    req.session.destroy();
    res.redirect('/');
});





module.exports = router;



