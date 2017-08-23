Email_queue    = require('../schema/models').email_queue;
var async      = require("async");
var http       = require("http");
var nodemailer = require("nodemailer");

var mailer = (function() {
    var self = {};
    
    var listofemails = [];

    var sucess_email = [];

    var failure_email = [];

    var transporter;

    self.massMailer = function() {
        transporter = nodemailer.createTransport({
            service: "SMTP",
            host: process.env.SMTP_SERVER,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD
            },
                tls: {rejectUnauthorized: false},
                debug:true
        });

        self.invokeOperation();
    };

    self.invokeOperation = function() {
        async.each(listofemails,self.SendEmail,function(){
            console.log(sucess_email);
            console.log(failure_email);
        });
    };

    self.SendEmail = function(Email, callback) {
        self.status = false;

        async.waterfall([
            function(callback) {                
                var mailOptions = {
                    from: 'Guaxi <no_reply@gastosabertos.org>',     
                    to: Email,
                    subject: 'Guaxi - Recebi sua inscrição com sucesso!', 
                    html: "Olá!<br><br>Eu, Guaxi, vi que você se inscreveu para o segundo ciclo do processo de missões do Gastos Abertos.<br><br>Em breve um membro da equipe do Gastos Abertos irá entrar em contato através do e-mail que você cadastrou.<br><br>Muito obrigado parceiro!"
                };
                listofemails.pop(Email);
                transporter.sendMail(mailOptions, function(error, info) {               
                    if(error) {
                        console.log(error)
                        failure_email.push(Email);
                    } else {
                        self.status = true;
                        success_email.push(Email);
                    }
                    callback(null,self.status,Email);
                });
            },
            function(statusCode,Email,callback) {
                console.log("Will update DB here for " + Email + "With " + statusCode);
                Email_queue.create({
                        email: listofemails,
                        sucess: sucess_email ? sucess_email[0] : failure_email[0]
                    })
                .then(function(Email_queue) {
                    console.log("DB updated sucessfully");
                    return Email_queue;
                })
                .catch(e => {
                    console.log("Error creating user");
                    throw e;
                });
                callback();
            }
            ],function(){
                callback();
            }
        );
    }

    self.listofemails = listofemails;

    return self;
})();

module.exports = mailer;