/**
 * ----------------------------------------------------------------------------------------------------------------
 * Clear a range of values
 * @param {sheet} sheet 
 * @param {number} startRow header title
 */
const clearData = (sheet, startRow = 2) => 
{
  if(typeof sheet != `object`) return 1;
  let numCols = sheet.getLastColumn();
  let numRows = sheet.getLastRow() - startRow + 1; // The number of row to clear
  if (numRows == 0) numRows = 1;
  let range = sheet.getRange(startRow, 1, numRows,numCols);
  range.clear();
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Removes any row of data if the Date value is before today
 * @param {sheet} sheet
 * @param {string} dateHeaderName default is "Date"
 */
const removeExpiredEntries = (sheet,dateHeaderName="Date") => {
  // sheet = eventSheet; // for debugging
  if(typeof sheet != `object`) return 1;
  try {
    let today = new Date();
    let data = sheet.getDataRange().getValues();
    let lastRow = sheet.getLastRow()-1; //subtract header
    if (lastRow < 1) return 1;
    let col = data[0].indexOf(dateHeaderName);
    let range = sheet.getRange(2,col+1,lastRow,1).getValues();
    if (col == -1) {
      console.error(`Matching data by header failed...`);
      return false;
    }
    let rowsToDel = [];
    for (let i=0;i<range.length;i++){
      let date = new Date(range[i][0]);
      if (date <= today) {
        rowsToDel.push(i+2);
      }
    }
    for (let i=0;i<rowsToDel.length;i++){
      Logger.log(`Removing expired event: ${data[i+1][0]}, Date: ${range[rowsToDel[i]-2]}`);
      sheet.deleteRow(rowsToDel[i]);
    }
  } catch (err) {
    console.error(`${err} : removeExpiredEntry failed - Sheet: ${sheet} Col Name specified: ${dateHeaderName}`);
    return false;
  }
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Return the value of a cell by column name and row number
 * @param {sheet} sheet
 * @param {string} colName
 * @param {number} row
 */
const GetByHeader = (sheet, columnName, row) => {
  if(typeof sheet != `object`) return 1;
  try {
    let data = sheet.getDataRange().getValues();
    let col = data[0].indexOf(columnName);
    if (col != -1) return data[row - 1][col];
    else {
      console.error(`Getting data by header fucking failed...`);
      return 1;
    }
  } catch (err) {
    console.error(`${err} : GetByHeader failed - Sheet: ${sheet} Col Name specified: ${columnName} Row: ${row}`);
    return 1;
  }
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Return a dictionary of values from a whole row on a given sheet
 * @param {sheet} sheet
 * @param {number} row
 */
const GetRowData = (sheet, row) => {
  if(typeof sheet != `object`) return 1;
  let dict = {};
  try {
    let headers = sheet.getRange(1, 1, 1, sheet.getMaxColumns()).getValues()[0];
    headers.forEach( (name, index) => {
      let linkedKey = Object.keys(HEADERNAMES).find(key => HEADERNAMES[key] === name);
      if(!linkedKey) headers[index] = name;
      else headers[index] = linkedKey;
    })
    let data = sheet.getRange(row, 1, 1, sheet.getMaxColumns()).getValues()[0];
    headers.forEach( (header, index) => {
      dict[header] = data[index];
    });
    dict[`sheetName`] = sheet.getSheetName();
    dict[`row`] = row;
    // console.info(dict);
    return dict;
  } catch (err) {
    console.error(`${err} : GetRowData failed - Sheet: ${sheet} Row: ${row}`);
    return 1;
  }
}

const searchColForValue = (sheet, columnName, val) => {
  if(typeof sheet != `object`) return false;
  try {
    let data = sheet.getDataRange().getValues();
    let lastRow = sheet.getLastRow();
    let col = data[0].indexOf(columnName);
    let range = sheet.getRange(2,col+1,lastRow,1).getValues();
    // Logger.log(range);
    if (col != -1) {
      let isSearchStringInRange = range.some( function(row){
        return row[0] === val
      });
      return isSearchStringInRange;
    }
    else {
      console.error(`Matching data by header failed...`);
      return false;
    }
  } catch (err) {
    console.error(`${err} : searchForValue failed - Sheet: ${sheet} Col Name specified: ${columnName} value: ${val}`);
    return false;
  }
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Set the value of a cell by column name and row number
 * @param {sheet} sheet
 * @param {string} colName
 * @param {number} row
 * @param {any} val
 */
const SetByHeader = (sheet, columnName, row, val) => {
  // if(typeof sheet != `object`) return 1;
  let data;
  let col;
  try {
    data = sheet.getDataRange().getValues();
    col = data[0].indexOf(columnName) + 1;
    if(col != -1) {
      sheet.getRange(row, col).setValue(val);
      return 0;
    } else return 1;
  } catch (err) {
    Logger.log(`${err} : SetByHeader failed - Sheet: ${sheet} Row: ${row} Col: ${col} Value: ${val}`);
    console.error(`${err} : SetByHeader failed - Sheet: ${sheet} Row: ${row} Col: ${col} Value: ${val}`);
    return 1;
  }
};

/**
 * ------------------------------------------------------------------------------------------------------
 * Writes a row of data to a sheet. Input event data and it writes each value to the sheet with matching header name
 * @param {sheet} sheet
 * @param {dict} data 
 * @returns {dict} {header, value}
 */
const SetRowData = (sheet,data) => {
  if(typeof sheet != `object`) return 1;
  try {
    let sheetHeaderNames = Object.values(GetRowData(sheet, 1));
    let values = [];
    // for (const [index, [key]] of Object.entries(Object.entries(data))) {
      Object.entries(data).forEach(pair => {
        let headername = HEADERNAMES[pair[0]];
        let index = sheetHeaderNames.indexOf(headername);
        values[index] = pair[1];
      })
    // };
    // console.info(values);
    sheet.appendRow(values);
  } catch (err) {
    console.error(`${err} : SetRowData failed - Sheet: ${sheet}`);
    return 1;
  }
}