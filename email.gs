/**
 * -----------------------------------------------------------------------------------------------------------------
 * Send an Email
 * @required {string} Student Email
 * @required {string} Status
 */
class Emailer
{
  constructor({ 
    email : email = `Unknown Email`, 
    message : message = ``,
  }) {
    this.email = email;
    this.message = message;
    this.SendEmail();
  }

  SendEmail () {
    // const staff = BuildStaff();
    console.info(`Sending  email to ${this.email}.`);
    GmailApp.sendEmail(this.email, `${SERVICE_NAME} : Event Update`, "", {
      htmlBody: this.message.defaultMessage,
      from: SUPPORT_ALIAS,
      // cc: this.designspecialistemail,
      // bcc: staff.Chris.email,
      name: SERVICE_NAME,
      noReply: true,
    });
  }
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Class for Creating Response Messages
 * Properties accessed via `this.receivedMessage` or `this.failedMessage`
 * @param {string} name
 * @param {string} projectname
 * @param {number} jobnumber
 * @param {string} mat1
 * @param {number} material1Quantity
 * @param {string} material1Name
 * @param {string} mat2
 * @param {number} material2Quantity
 * @param {string} material2Name
 * @param {string} designspecialist
 * @param {string} designspecialistemaillink
 */
class CreateMessage
{
  constructor({
    events : events
  }) {
    this.events = events;
  }

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
        text-align:center;
        vertical-align:top
      }      
    </style>`;
    message += `<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-spacing:0px;padding:0;margin:0;width:100%;background-repeat:repeat;background-position:center top; background-color:#ffffff;"`;
    message += `<tbody><tr style="border-collapse: collapse;"><td valign="top" style="padding: 0;Margin: 0;">`
    message += `<table class="tg"><thead>`
    message += `<tr><td colspan=2><div style="text-align: center;">`
    message += `<a href="https://github.com/cparsell/music-spider">`
    message += `<img src="https://imgur.com/7ewDM0v.png" height="25%" width="25%"/></a><br>`;
    message += `<span style="font-family:georgia,times,times new roman,serif;font-size:28px;color:#000000;">`;
    message += `<strong>${SERVICE_NAME}</strong><br><br></span></div></td></tr></thead>`;
    message += `<tbody>`
    // for (const key of Object.keys(this.events)) { 

    // debugLog("ordered", ordered);
    for (const [index, [key]] of Object.entries(Object.entries(this.events))) {
      const {date, city, venue, url, image, eName} = this.events[key];
      let eDate = new Date(key);
      // Logger.log(eDate);
      let eventDate = eDate.toLocaleDateString();
      // Logger.log(eventDate);
      let eventTime = Utilities.formatDate(eDate, "PST", "h a");

      if (isEven(index)) {
        message += `<tr>`;
      }
      message += `<td class="tg-0lax"><div style="text-align: center;">`;
      message += `<div class="" style=""><a href='${url}'>`;
      message += `<img src='${image}' class="" style="width:90%;float:center;width:400px;height:240px;object-fit:cover;"/></div>`;
      message += `<span style="font-family:georgia,times,times new roman,serif">`;
      message += `<a href='${url}' style="text-decoration:none;"><span style="color:#44494c;font-size:20px;"><strong>${eName}</strong></span></a><br>`;
      message += `<span style="color:#696969;font-size:12px;">at ${venue}, ${city}<br> `;
      message += `<strong>${eventDate}</strong> ${eventTime}</span></span></div>`;
      message += `<br/></td>`;
      if (!isEven(index)) message += `</tr>`;
    };
    message += `<p></p></tbody></table>`; 
    message += `</td></tr></tbody></table>`;
    return message; 
  }
}