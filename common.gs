// Common GAS Functions
// v2.2.0 - 2021-10-04

const common = {

  // Retrieve file as JSON object
  grabJson: function(id)
  {
    let file = DriveApp.getFileById(id).getAs("application/json");
    return JSON.parse(file.getDataAsString());
  },

  // Parse URL path parameters
  parsePathParameters: function(request)
  {
    // If there's only one parameter, just treat it as a path
    if (!request.queryString.match(/\=/))
    {
        return request.queryString;
    }

    // Look for a parameter called "path"
    return request.parameter.path || "";
  },

  // Strip spaces, no-break spaces, zero-width spaces,
  // & zero-width no-break spaces
  trim: function(string)
  {
    let pattern = /(^[\s\u00a0\u200b\uFEFF]+)|([\s\u00a0\u200b\uFEFF]+$)/g;
    return string.replace(pattern, "");
  },

  // Retrieve text from inside XML tags
  stripXml: function(input)
  {
    // Only parse input if it looks like it contains tags
    if (input.match(/<[^>]*>/))
    {
      // Find where the tags start & end
      let start = input.indexOf('<');
      let end = input.lastIndexOf('>') + 1;

      // Grab any text before all XML tags
      let pre = input.slice(0, start);
      // Grab any text after all XML tags
      let post = input.slice(end);
      let inside = "";

      try
      {
        // Parse input without any pre or post text
        let cleanInput = input.slice(start, end);

        let doc = XmlService.parse(cleanInput);
        inside = doc.getRootElement().getText();
      }
      catch (error)
      {
        writer.Info(input + " = " + error);
      }

      return pre + inside + post;
    }
    return input;
  },

  // Convert a JSON string to a pretty-print JSON string
  prettifyJson: function(input)
  {
      return JSON.stringify(JSON.parse(input), null, 4);
  },

  // Collate objects at given path, from array of JSON strings
  collateArrays: function(path, objects)
  {
    let outArray = [];
    let chunks = path.split('.');

    // Iterate over each object
    // try {
      for (const resp of objects)
      {
        // Logger.log(resp);
        let obj = JSON.parse(resp);
        for (const chunk of chunks)
        {
            obj = obj[chunk];
        }
        outArray = outArray.concat(obj);
      }

    return outArray;
  },
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Remove duplictes from an array
 * @param {array} array
 */
const arrUnique = (array) => {
  let outArray = [];
  array.sort();
  outArray.push(array[0]);
  for(let n in array){
    // Logger.log(outArray[outArray.length-1]+'  =  '+array[n]+' ?');
    if(outArray[outArray.length-1]!=array[n]){
      outArray.push(array[n]);
    }
  }
  return outArray;
}

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
 * Log a value to Execution Log if config.debug = true
 * @param {string} valueName "variable"
 * @param {variable} value the variable itself
 */
const debugLog = (valueName, value) => 
{
  if (config.debug) 
  {
    Logger.log(`${value.length} ${valueName}`);
    Logger.log(`${valueName}: ${value}`);
  }
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Return TRUE if number is even, FALSE if it is odd
 * @param {number} n
 */
const isEven = (n) => {
   return n % 2 == 0;
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
  Logger.log(data);
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
        Logger.log(row[0]);
        Logger.log(val);
        return row[0] === val
      });
      Logger.log(isSearchStringInRange);
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