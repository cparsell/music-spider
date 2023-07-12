
const configSidebar = async () => {
  const ui = SpreadsheetApp.getUi();
  let template = HtmlService.createTemplateFromFile('sidebar')
  // template.types = TYPES;
  let html = HtmlService
    .createHtmlOutput(
      template.evaluate()
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .getBlob()
        .setName(`${SERVICE_NAME} Menu`)
      ).setWidth(400)
  ui.showSidebar(html);
}

const ProcessForm = (formObject) => {
  let type = ``, names = []; 
  Object.entries(formObject).forEach( pair => {
    console.info(`Key: ${pair[0]}, Value: ${pair[1]}`);
  //   if(pair[0] == `type`) type = pair[1];
  //   if(pair[0] == `names`) names = pair[1];
  })

  // const USER_PROPS = PropertiesService.getUserProperties();
  // try {
  //   USER_PROPS.setProperties({});
  // } catch (err) {
  //   console.log(`Sidebar - Set User Properties Error: ${err.message}`);
  // }
}