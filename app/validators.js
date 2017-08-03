var builder   = require('botbuilder');
var validator = require("email-validator");
var phone     = require("phone");

const library = new builder.Library('validators');

const StateRegex = new RegExp(/^((AC)|(AL)|(AP)|(AM)|(BA)|(CE)|(DF)|(ES)|(GO)|(MA)|(MT)|(MS)|(MG)|(PA)|(PB)|(PR)|(PE)|(PI)|(RJ)|(RN)|(RS)|(RO)|(RR)|(SC)|(SP)|(SE)|(TO))$/);

function cellphone (response) {
    var valid_cellphone = phone(response, 'BR');
    if (valid_cellphone) {
        return 1;
    }
    else {
        return 0;
    }
}

library.dialog('email',
    builder.DialogAction.validatedPrompt(builder.PromptType.text, (response) =>
        validator.validate(response)));

library.dialog('state',
    builder.DialogAction.validatedPrompt(builder.PromptType.text, (response) =>
        StateRegex.test(response)));

library.dialog('cellphone',
    builder.DialogAction.validatedPrompt(builder.PromptType.text, (response) =>
        cellphone(response)));

module.exports = library;
module.exports.validator  = validator;
module.exports.StateRegex = StateRegex;
module.exports.phone      = phone;