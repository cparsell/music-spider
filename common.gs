// Common GAS Functions
// v2.2.0 - 2021-10-04

const common = {

  // Retrieve file as JSON object
  grabJson: function(id)
  {
    var file = DriveApp.getFileById(id).getAs("application/json");
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
    var pattern = /(^[\s\u00a0\u200b\uFEFF]+)|([\s\u00a0\u200b\uFEFF]+$)/g;
    return string.replace(pattern, "");
  },

  // Retrieve text from inside XML tags
  stripXml: function(input)
  {
    // Only parse input if it looks like it contains tags
    if (input.match(/<[^>]*>/))
    {
      // Find where the tags start & end
      var start = input.indexOf('<');
      var end = input.lastIndexOf('>') + 1;

      // Grab any text before all XML tags
      var pre = input.slice(0, start);
      // Grab any text after all XML tags
      var post = input.slice(end);
      var inside = "";

      try
      {
        // Parse input without any pre or post text
        var cleanInput = input.slice(start, end);

        var doc = XmlService.parse(cleanInput);
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
    var outArray = [];
    var chunks = path.split('.');

    // Iterate over each object
    // try {
      for (const resp of objects)
      {
        // Logger.log(resp);
        var obj = JSON.parse(resp);
        for (const chunk of chunks)
        {
            obj = obj[chunk];
        }
        outArray = outArray.concat(obj);
      }

    return outArray;
  },
};

// const compare = (artistName) =>
// {
//   var sh=artistSheet;
//   var lastRow=sh.getLastRow();
//   var rg=sh.getRange(2, 1, lastRow, 1);
//   var vA=rg.getValues();
//   var theseRowsEqualTheValueInTheLastRowA=[];
//   for(var i=0;i<lastRow-1;i++)
//   {
//     if(vA[i][0]==artistName)
//     {
//       Logger.log(`${artistName} exists already`)
//       return true;
//     }
//   }
//   Logger.log(`${artistName} doesn't exist already`)
//   return false;
// }

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Remove duplictes from an array
 * @param {array} array
 */
const arrUnique = (array) => {
  var outArray = [];
  array.sort();
  outArray.push(array[0]);
  for(var n in array){
    // Logger.log(outArray[outArray.length-1]+'  =  '+array[n]+' ?');
    if(outArray[outArray.length-1]!=array[n]){
      outArray.push(array[n]);
    }
  }
  return outArray;
}

const clearColumn = (sheet, colNumber, startRow) => 
{
  //colNumber is the numeric value of the colum
  //startRow is the number of the starting row

  var numRows = sheet.getLastRow() - startRow + 1; // The number of row to clear
  if (numRows == 0) numRows = 1;
  var range = sheet.getRange(startRow, colNumber, numRows);
  range.clear();
}

const debugLog = (valueName, value) => 
{
  if (config.debug) 
  {
    Logger.log(`${value.length} ${valueName}`);
    Logger.log(`${valueName}: ${value}`);
  }
}

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
 * ----------------------------------------------------------------------------------------------------------------
 * Return a dictionary of values from a whole row on a given sheet
 * @param {sheet} sheet
 * @param {number} row
 */
const SetRowData = (sheet, row, rowData) => {
  if(typeof sheet != `object`) return 1;
  let dict = {};
  try {
    let headers = sheet.getRange(1, 1, 1, sheet.getMaxColumns()).getValues()[0];

  } catch (err) {
    console.error(`${err} : SetRowData failed - Sheet: ${sheet} Row: ${row}`);
    return 1;
  }
}