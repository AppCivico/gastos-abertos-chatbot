/* global builder:true */
/* eslint no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor":
["session"] }] */

const library = new builder.Library('validators');

const PhoneRegex = new RegExp(/^(\(?[0-9]{2}\)?)[\s-]?([9]{1})?([0-9]{4})-?([0-9]{4})$/);
const StateRegex = new RegExp(/^((AC)|(AL)|(AP)|(AM)|(BA)|(CE)|(DF)|(ES)|(GO)|(MA)|(MT)|(MS)|(MG)|(PA)|(PB)|(PR)|(PE)|(PI)|(RJ)|(RN)|(RS)|(RO)|(RR)|(SC)|(SP)|(SE)|(TO)|(ac)|(al)|(ap)|(am)|(ba)|(ce)|(df)|(es)|(go)|(ma)|(mt)|(ms)|(mg)|(pa)|(pb)|(pr)|(pe)|(pi)|(rj)|(rn)|(rs)|(ro)|(rr)|(sc)|(sp)|(se)|(to))$/);
const DateRegex = new RegExp(/^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/); // eslint-disable-line no-useless-escape
const MailRegex = new RegExp(/^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-?\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/); // eslint-disable-line no-useless-escape

function basicPrompterWithRegex(regex) {
	return new builder.IntentDialog()
		.onBegin((session, args) => {
			session.dialogData.retryPrompt = args.retryPrompt;
			session.send(args.prompt);
		}).matches(regex, (session) => {
			session.endDialogWithResult({ response: session.message.text });
		}).onDefault((session) => {
			session.send(session.dialogData.retryPrompt);
		});
}

library.dialog('cellphone', basicPrompterWithRegex(PhoneRegex));
library.dialog('state', basicPrompterWithRegex(StateRegex));
library.dialog('date', basicPrompterWithRegex(DateRegex));
library.dialog('email', basicPrompterWithRegex(MailRegex));

module.exports = library;
