const builder = require('botbuilder');
const validator = require('email-validator');

const library = new builder.Library('validators');

const StateRegex = new RegExp(/^((AC)|(AL)|(AP)|(AM)|(BA)|(CE)|(DF)|(ES)|(GO)|(MA)|(MT)|(MS)|(MG)|(PA)|(PB)|(PR)|(PE)|(PI)|(RJ)|(RN)|(RS)|(RO)|(RR)|(SC)|(SP)|(SE)|(TO)|(ac)|(al)|(ap)|(am)|(ba)|(ce)|(df)|(es)|(go)|(ma)|(mt)|(ms)|(mg)|(pa)|(pb)|(pr)|(pe)|(pi)|(rj)|(rn)|(rs)|(ro)|(rr)|(sc)|(sp)|(se)|(to))$/);
const PhoneRegex = new RegExp(/^(\(?[0-9]{2}\)?)(\s)?([9]{1})?([0-9]{4})-?([0-9]{4})$/);
const DateRegex = new RegExp(/^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/); // eslint-disable-line no-useless-escape
// TODO

library.dialog(
	'email',
	builder.DialogAction.validatedPrompt(builder.PromptType.text, response =>
		validator.validate(response)) // eslint-disable-line comma-dangle
);

library.dialog(
	'state',
	builder.DialogAction.validatedPrompt(builder.PromptType.text, response =>
		StateRegex.test(response)) // eslint-disable-line comma-dangle
);

library.dialog(
	'cellphone',
	builder.DialogAction.validatedPrompt(builder.PromptType.text, response =>
		PhoneRegex.test(response)) // eslint-disable-line comma-dangle
);

library.dialog(
	'date',
	builder.DialogAction.validatedPrompt(builder.PromptType.text, response =>
		DateRegex.test(response)) // eslint-disable-line comma-dangle
);

module.exports = library;
module.exports.validator = validator;
module.exports.StateRegex = StateRegex;
module.exports.PhoneRegex = PhoneRegex;
module.exports.DateRegex = DateRegex;
