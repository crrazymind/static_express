$(document).ready(function() {
    intiSend();
});

function intiSend(){
    var btn = $('#btn1');
    var mailbody = $('#mailtext');
    //var url = window.location.host;
    var url = '/index.html';
    btn.click(function() {
        $.ajax({
            url: url,
            type: 'post',
            crossDomain : true,
            data: mailbody.val(),
            dataType: 'text'
        }).done(function() {
            btn.val(mailbody.val() + " sent");
        });
        return false;
    });
}