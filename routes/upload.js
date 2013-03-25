module.exports = function(app)
{
    fs = require('fs');
    everyauth = require('everyauth');
    nconf = require('nconf'),
    Recaptcha = require('recaptcha').Recaptcha;

    function renderUploadView(req, res)
    {
        var recaptcha = new Recaptcha(nconf.get('recaptcha:publicKey'), nconf.get('recaptcha:privateKey'));
        res.render('upload', {
            title: 'Upload images here.',
            recaptcha_upload: recaptcha.toHTML()
        });
    }

    // uploads page
    app.get('/upload', function(req, res)
    {
        if(req.user)
        {
            renderUploadView(req, res);
        } else
        {
            res.redirect('/login');
        }

    });

    app.get('/upload_image', function(req, res)
    {
        renderUploadView(req, res);
    });

    app.post('/upload_image', function(req, res)
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
                fs.readFile(req.files.displayImage.path, function(err, data)
                {
                    var newPath = __dirname + "../../public/user_uploads/" + req.files.displayImage.name;
                    newItem = fs.writeFile(newPath, data, function(err)
                    {
                        res.write('\n upload failed!');
                        res.redirect("back");
                    });
                    var renderPath = "/user_uploads/" + req.files.displayImage.name;
                    res.render('upload_thanks', {
                        title: 'thanks for upload',
                        imagedata: renderPath
                    });
                });
            }
            else
            {
                // Redisplay the form.
                renderUploadView(req, res);
            }
        });
    });
}
