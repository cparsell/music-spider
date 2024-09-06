/**
 * ----------------------------------------------------------------------------------------------------------------
 * Create a Google Calendar Event for a Concert
 * Trigger - Create menu when spreadsheet is opened
 * @param {array} events an array of event objects [{eName: '', date: '1/23/2024', ...}]
 * @returns {void}
 */
const createCalEvents = (events) => {
  let calendarId = Config.CALENDAR_ID;
  let eventCal = CalendarApp.getCalendarById(calendarId);
  for (const [index, [key]] of Object.entries(Object.entries(events))) {
    let date = new Date(events[key].date);
    let endTime = new Date(addHours(events[key].date, 3));
    eventCal.createEvent(
      `${events[key].eName} at ${events[key].venue}`,
      date,
      endTime,
      {
        location: events[key].address,
        description: `For tickets: ${events[key].url}`,
      }
    );
    Logger.log(`Created calendar event for ${events[key].eName}`);
  }
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Create a Google Calendar Event for a Concert
 * Returns a time H hours after the specified
 * @param {datetime} time
 * @param {integer} h number of hours
 * @returns {datetime} finishDate the time H hours after the specified time
 */
const addHours = (time, h) => {
  let date = new Date(time).getTime();
  let finish = date + h * 60 * 60 * 1000;
  let finishDate = new Date(finish);
  return finishDate;
};
