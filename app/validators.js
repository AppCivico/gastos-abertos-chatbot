var builder   = require('botbuilder');
var validator = require("email-validator");

const library = new builder.Library('validators');

const StateRegex = new RegExp(/^((AC)|(AL)|(AP)|(AM)|(BA)|(CE)|(DF)|(ES)|(GO)|(MA)|(MT)|(MS)|(MG)|(PA)|(PB)|(PR)|(PE)|(PI)|(RJ)|(RN)|(RS)|(RO)|(RR)|(SC)|(SP)|(SE)|(TO))$/);
const PhoneRegex = new RegExp(/^(\([0-9]{2}\))([9]{1})?([0-9]{4})-([0-9]{4})$/);

library.dialog('email',
    builder.DialogAction.validatedPrompt(builder.PromptType.text, (response) =>
        validator.validate(response)));

library.dialog('state',
    builder.DialogAction.validatedPrompt(builder.PromptType.text, (response) =>
        StateRegex.test(response)));

library.dialog('cellphone',
    builder.DialogAction.validatedPrompt(builder.PromptType.text, (response) =>
        PhoneRegex.test(response)));

module.exports = library;
module.exports.validator  = validator;
module.exports.StateRegex = StateRegex;
module.exports.PhoneRegex = PhoneRegex;