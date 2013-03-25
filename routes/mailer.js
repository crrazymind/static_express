
module.exports = function(app)
{
    fs = require('fs');
    nconf = require('nconf'),
    Recaptcha = require('recaptcha').Recaptcha;
    var nodemailer = require("nodemailer");

    function renderMailView(req, res)
    {
        var recaptcha = new Recaptcha(nconf.get('recaptcha:publicKey'), nconf.get('recaptcha:privateKey'));
        res.render('sendmail', {
            title: 'Contact us',
            recaptcha_upload: recaptcha.toHTML()
        });
    }


    app.get('/sendmail', function(req, res)
    {
        renderMailView(req, res);
    });

    app.get('/mail_sent', function(req, res)
    {
        renderMailView(req, res);
    });

    app.post('/mail_sent', function(req, res)
    {
        var captcha_data = {
            remoteip: req.connection.remoteAddress,
            challenge: req.body.recaptcha_challenge_field,
            response: req.body.recaptcha_response_field
        };
        var recaptcha = new Recaptcha(nconf.get('recaptcha:publicKey'), nconf.get('recaptcha:privateKey'), captcha_data);
        recaptcha.verify(function(success, error_code)
        {
            if(success)
            {
                // create reusable transport method (opens pool of SMTP connections)
                var login = nconf.get('mail:login');
                var pwwd = nconf.get('mail:password');

                var smtpTransport = nodemailer.createTransport("SMTP", {
                    service: "Gmail",
                    auth: {
                        user: login,
                        pass: pwwd
                    }
                });

                // setup e-mail data with unicode symbols
                var mailOptions = {
                    from: req.body.name, // sender address
                    to: "crazymind2004@gmail.com", // list of receivers
                    subject: "sent from site", // Subject line
                    //text: req.body.mailbody, // plaintext body
                    html: req.body.mailbody // html body
                }
                
                //send mail with defined transport object
                smtpTransport.sendMail(mailOptions, function(error, response)
                {
                    if(error)
                {
                    console.log(error);
                    res.redirect('/');
                } else{
                    console.log("Message sent: " + response.message);
                    res.redirect('/');

                }

                // if you don't want to use this transport object anymore, uncomment following line
                smtpTransport.close(); // shut down the connection pool, no more messages
                });
            }
            else { renderMailView(req, res); }
        });
    });
}