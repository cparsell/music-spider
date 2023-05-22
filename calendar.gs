const createCalEvents = (events) => 
{
  let calendarId = Config.CALENDAR_ID;
  let eventCal = CalendarApp.getCalendarById(calendarId);
  for (const [index, [key]] of Object.entries(Object.entries(events))) 
  {
    let date = new Date(events[key].date);
    let endTime = new Date(addHours(events[key].date,3));
    eventCal.createEvent(`${events[key].eName} at ${events[key].venue}`, date, endTime, 
    {
      location: events[key].address,
      description: `For tickets: ${events[key].url}`,
    });
    Logger.log(`Created calendar event for ${events[key].eName}`);
  }
}

const addHours = (time, h) => 
{
  let date = new Date(time).getTime();
  let finish = date + (h*60*60*1000);
  let finishDate = new Date(finish);
  return finishDate;
}