/**
 * ----------------------------------------------------------------------------------------------------------------
 * sendEmail
 * Trigger - Send email newsletter listing any upcoming events. This function prepares the list of events and passes
 * it off to an instance of the CreateMessage class, which generates the raw email content. Then it creates an
 * instance of the Emailer class which sends the message.
 */
const sendEmail = () => {
  try {
    let eventsArr = buildEventsArr(); // get the events from the sheet
    let msgSubjRaw = []; // array of artists to be listed in subject line
    let msgSubj = `${SERVICE_NAME} - `;
    if (eventsArr.length === 0) {
      console.warn("No events to add to email.");
      return;
    }
    // for (const [index, [key]] of Object.entries(Object.entries(eventsArr)))
    for (let key = 0; key < eventsArr.length; key++) {
      if (eventsArr[key].acts == "") {
        msgSubjRaw.push(eventsArr[key].eName);
        continue;
      }
      let actsArr = eventsArr[key].acts.split(",");
      msgSubjRaw.push(actsArr[0]);
    }
    // remove duplicates from list of acts
    let uniq = [...new Set(msgSubjRaw)];
    msgSubj += uniq.join(", ");

    let message = new CreateMessage({ events: eventsArr });
    new Emailer({
      message: message,
      email: Config.email(),
      subject: msgSubj,
    });
  } catch (err) {
    console.error(`sendEmail() error - ${err}`);
  }
};

/**
 * -----------------------------------------------------------------------------------------------------------------
 * class to send an Email
 * @required {string} email
 * @required {string} message
 * @required {string} subject
 */
class Emailer {
  constructor({
    email: email = `Unknown Email`,
    message: message = ``,
    subject: subject = `${SERVICE_NAME} : Event Update`,
  }) {
    /**
     * @property {string} email recipient
     */
    this.email = email;
    /**
     * @property {string} message contents of email
     */
    this.message = message;
    /**
     * @property {string} subject subject of message
     */
    this.subject = subject.substring(0, 249); // limits subject to 249 characters
    this.SendEmail();
  }

  /**
   * @property {Function} SendEmail send the message
   * @returns {void}
   */
  SendEmail() {
    try {
      console.info(`Sending  email to ${this.email}.`);
      GmailApp.sendEmail(this.email, this.subject, "", {
        htmlBody: this.message.defaultMessage,
        name: SERVICE_NAME,
        noReply: true,
      });
    } catch (err) {
      console.error(`${err} : Couldn't send email. Something went wrong.`);
    }
  }
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Class for Creating Email Message
 * Properties accessed via `this.receivedMessage` or `this.failedMessage`
 */
class CreateMessage {
  constructor({ events: events }) {
    /**
     * @property {object} events {{name: name, venue: venue...}{name: name,venue: venue...}}
     */
    this.events = events;
  }

  /**
   * @property {Function} defaultMessage format the message
   * @returns {string} message HTML contents of message
   */
  get defaultMessage() {
    let message = `<style type="text/css">
      .tg {
        border-collapse:collapse;
        border-spacing:0;
        }
      .tg td {
        border-color:black;
        border-style:solid;
        border-width:1px;
        font-family:georgia,times,times new roman,serif;
        font-size:14px;
        overflow:hidden;
        padding:5px 5px;
        word-break:normal;
      }
      .tg th {
        border-color:black;
        border-style:solid;
        border-width:1px;
        font-family:georgia,times,times new roman,serif;
        font-size:14px;
        font-weight:normal;
        overflow:hidden;
        padding:5px 5px;
        word-break:normal;
      }
      .tg .tg-0lax{
        text-align:left;
        vertical-align:top
      }      
    </style>`;
    // top of email
    message += `<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-spacing:0px;padding:0;margin:0;width:100%;background-repeat:repeat;background-position:center top; background-color:#f8f8f8;"`;
    message += `<tbody><tr style="border-collapse: collapse;"><td valign="top" style="padding: 0;Margin: 0;">`;
    message += `<table class="tg" align="center" style="border-collapse: collapse;border-spacing: 0px;background-color: #ffffff;width: 750px;"><thead>`;
    message += `<tr><td colspan=2><div style="text-align: center;"><br/><br/>`;
    message += `<a href="https://github.com/cparsell/music-spider">`;
    message += `<img src="https://i.postimg.cc/xjv4nbBV/music-spider-logo-nobg.png" height="22%" width="22%"/></a><br>`;
    message += `<span style="font-family:helvetica, sans-serif;font-size:30px;color:#e9e9e9;">`;
    message += `<strong>${SERVICE_NAME.toLowerCase()}</strong><br><br></span></div></td></tr></thead>`;
    message += `<tbody>`;
    // for (const key of Object.keys(this.events)) {

    // iterate through list of events
    // for (const [index, [key]] of Object.entries(Object.entries(this.events)))
    for (let key = 0; key < this.events.length; key++) {
      const { date, city, venue, url, url2, image, eName, acts } =
        this.events[key];
      let actsArr = new Array();
      let actsB = new Array();
      //turn text into array
      if (acts != undefined) actsArr = acts.split(",");
      // look for acts' names in event name - if name is in event name, dont list it again
      for (let i = 0; i < actsArr.length; i++) {
        if (!eName.match(actsArr[i])) {
          actsB.push(actsArr[i]);
        }
      }
      let eDate = new Date(this.events[key].date);
      let eventDay = eDate.getDay();
      let eventDayNum = eDate.getDate();
      let eventMonth = eDate.getMonth();
      let eventYear = eDate.getFullYear();
      let eventTime = Utilities.formatDate(eDate, "PST", "h a");
      // Start a new table row every even event
      if (CommonLib.isEven(key)) {
        message += `<tr>`;
      }
      message += `<td class="tg-0lax" style="height:300px;vertical-align:top;"><div style="text-align: left;margin-left: 10px;">`;
      message += `<div class="" style=""><a href='${url}'>`;
      message += `<img src='${image}' class="" style="width:90%;float:center;object-position:top;width:350px;height:200px;object-fit:cover;"/></div>`;
      message += `<span style="font-family: Averta,Helvetica Neue,Helvetica,Arial,sans-serif;">`;
      message += `<a href='${url}' style="text-decoration:none;"><span style="color:#44494c;font-size:20px;"><strong>${eName}</strong></span></a><br/>`;
      let actsUpper = actsB.map(function (x) {
        return x.toUpperCase();
      });
      if (actsUpper.length > 1 || !eName.toUpperCase().match(actsUpper[0])) {
        actsB.forEach((act, index) => {
          if (index == 0) message += `with `;
          if (!eName.toUpperCase().match(act.toUpperCase()) && index < 6) {
            message += index == actsB.length - 1 ? `${act}` : `${act}, `;
          }
          if (index == 6) message += `...`; // truncate list if longer than 5
        });
        message += `<br/>`;
      }
      message += `<span style="color:#696969;font-size:12px;font-family:georgia,times,times new roman,serif;">at ${venue}, ${city}<br/> `;
      message += `<strong>${DAY_NAMES[eventDay]}, ${MONTH_NAMES[eventMonth]} ${eventDayNum} ${eventYear}</strong> ${eventTime}</span></span>`;
      if (url2)
        message += `<br>
        <span style=''>
          <a href='${url2}' style='text-decoration:none;color:#696969;font-size:11px;font-family:georgia,times,times new roman,serif;'>
            Tickets also available here
          </a>
        </span></br>`;
      message += `</div><br/></td>`;

      if (!CommonLib.isEven(key)) message += `</tr><br/>`; // End table row every odd event
    }
    message += `<br/></tbody></table>`;
    message += `</td></tr></tbody></table>`;
    return message;
  }
}
