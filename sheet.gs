/**
 * ----------------------------------------------------------------------------------------------------------------
 * Add array to sheet
 * @param {object} sheet
 * @param {integer} column
 * @param {array} values
 * @returns {void}
 */
const addArrayToSheet = (sheet, column, values) => {
  if (typeof sheet != `object`) return 1;
  let range = [column, "1:", column, values.length].join("");
  let fn = function (v) {
    return [v];
  };
  sheet.getRange(range).setValues(values.map(fn));
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Build array of artists
 * Gets artist names from Artists (Spotify) sheet
 * and 'Artists (Custom)' sheet if searchManuallyAdded = TRUE
 * in the config.gs file
 * @returns {array} filtered array of artists
 */
const artistsList = () => {
  let results = new Array();
  let artistRows = ARTIST_SHEET.getLastRow() - 1;
  if (artistRows == 0) artistRows = 1;
  let artistsArr = ARTIST_SHEET.getRange(2, 1, artistRows, 1).getValues();

  for (let i = 0; i < artistsArr.length; i++) {
    results.push(artistsArr[i][0]);
  }
  // if searchManuallyAdded = TRUE, include artists in 'Artists (Custom)' sheet in the search
  if (Config.SEARCH_MANUALLY_ADDED) {
    let customArtistRows = CUSTOM_ARTIST_SHEET.getLastRow() - 1;
    let manualArtistsArr = CUSTOM_ARTIST_SHEET.getRange(
      2,
      1,
      customArtistRows,
      1
    ).getValues();
    for (let i = 0; i < manualArtistsArr.length; i++) {
      results.push(manualArtistsArr[i][0]);
    }
    // artistsArr.push(...manualArtistsArr);
  }

  // let filtered = artistsArr.filter(n => n); // removes blank strings
  let filtered = CommonLib.arrayRemoveDupes(results, true); // remove duplicates and blank strings
  return filtered;
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Build Events Array
 * Remove duplictes from an array
 * @param {array} array
 * @returns {array} array
 */
const buildEventsArr = () => {
  try {
    let lastRow = EVENT_SHEET.getLastRow();
    let events = new Array();

    if (lastRow > 1) {
      for (i = 1; i < lastRow; i++) {
        let rowData = CommonLib.getRowData(EVENT_SHEET, HEADERNAMES, i + 1);
        let { date } = rowData;
        date = new Date(date);
        // let formattedDate = Utilities.formatDate(newDate, `PST`,`MM-dd-yyyy hh:mm a`);
        let eventDate = Utilities.formatDate(date, "PST", "yyyy/MM/dd HH:mm");
        rowData.date = eventDate;
        events.push(rowData);
        // events[eventDate] = rowData;
      }
      // Log.Info(JSON.stringify(events));
      // Sort by key, which is the date
      let ordered = events.sort(function (a, b) {
        return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
        // return a.date.localeCompare(b.date);
      });

      // ordered = Object.keys(events).sort().reduce(
      //   (obj, key) =>
      //   {
      //     obj[key] = events[key];
      //     return obj;
      //   },
      //   {}
      // );
      // Log.Info(JSON.stringify(ordered));
      return ordered;
    } else {
      console.warn("No events found- unable to build array of Events");
    }

    return [];
  } catch (err) {
    console.error(`buildEventsArr() error - ${err}`);
  }
};

const compareArrays = (arr1, arr2) => {
  compare = (a1, a2) => arr1.reduce((a, c) => a + arr2.includes(c), 0);

  Logger.log(compare(arr1, arr2));
  return compare(arr1, arr2);
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Removes any row of data if the Date value is before today
 * @param {sheet} sheet
 * @param {string} dateHeaderName default is "Date"
 */
const removeExpiredEntries = (sheet) => {
  dateHeaderName = HEADERNAMES.date;
  // sheet = EVENT_SHEET; // for debugging
  if (typeof sheet != `object`) return 1;
  try {
    let today = new Date();
    let data = sheet.getDataRange().getValues();
    let lastRow = sheet.getLastRow() - 1; //subtract header
    if (lastRow < 1) return 1;
    let col = data[0].indexOf(dateHeaderName);
    let range = sheet.getRange(2, col + 1, lastRow, 1).getValues();
    if (col == -1) {
      throw new Error(`Matching data by header failed...`);
    }
    let rowsToDel = [];
    for (let i = 0; i < range.length; i++) {
      let date = new Date(range[i][0]);
      if (date <= today) {
        rowsToDel.push(i + 2);
      }
    }
    for (let i = 0; i < rowsToDel.length; i++) {
      Log.Info(
        `Removing expired event: ${data[i + 1][0]}, Date: ${
          range[rowsToDel[i] - 2]
        }`
      );
      sheet.deleteRow(rowsToDel[i]);
    }
    return 0;
  } catch (err) {
    console.error(
      `${err} : removeExpiredEntry failed - Sheet: ${sheet} Col Name specified: ${dateHeaderName}`
    );
    return 1;
  }
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Return a dictionary of values from a whole row on a given sheet
 * @param {sheet} sheet
 * @param {number} row
 * @returns {object} dict a dictionary of row data {columnName: cellValue, col2name: cellValue...}
 */
const GetRowData = (sheet, row) => {
  if (typeof sheet != `object`) return 1;
  let dict = {};
  try {
    let headers = sheet.getRange(1, 1, 1, sheet.getMaxColumns()).getValues()[0];
    headers.forEach((name, index) => {
      let linkedKey = Object.keys(HEADERNAMES).find(
        (key) => HEADERNAMES[key] === name
      );
      if (!linkedKey) headers[index] = name;
      else headers[index] = linkedKey;
    });
    let data = sheet.getRange(row, 1, 1, sheet.getMaxColumns()).getValues()[0];
    headers.forEach((header, index) => {
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
};

/**
 * Split addresses at the first comma or semicolon
    And replace 'St.' or 'Street' with 'St'
    Returns something like: 1290 Sutter Street
    This reduces false negatives if Ticketmaster shows CA but another shows it as California
 * @param address 
 * @returns 
 */
const filterAddress = (address) => {
  filtered = address.replace(/(Avenue|Ave[.]?)/g, "Ave");
  filtered = address.replace(/(Street|St[.]?)/g, "St");
  filtered = address.replace(/(Drive|Dr[.]?)/g, "Dr");
  filtered = address.replace(/(Road|Rd[.]?)/g, "Rd");
  return filtered;
};
/**
 * ----------------------------------------------------------------------------------------------------------------
 * Filter list of new events to exclude ones that already exist on the Events Sheet
 * Either:
 *  A. URLs are the same OR
 *  B. the event NAMES, ADDRESSES, and DATES are the same
 * In the case of B, it will add the URL to the URL2 column so one can choose from multiple ticket vendors
 * @param {array} newArray list of new results
 * @param {array} existingArray list of existing events
 * @returns {object} {filtered :[{}], alt: [{}]}
 */
const filterDupeEvents = (newArray, existingArray) => {
  // this filter function tests whether the same event exists already
  // and returns the filtered array
  let reduced = newArray.filter(
    (aItem) =>
      !existingArray.find((bItem) => {
        let aDate = Utilities.formatDate(
          new Date(aItem["date"]),
          "PST",
          "yyyy/MM/dd"
        );
        let bDate = Utilities.formatDate(
          new Date(bItem["date"]),
          "PST",
          "yyyy/MM/dd"
        );
        let dateScore = aDate == bDate ? true : false;

        let aName = aItem["eName"].toString().toUpperCase();
        let bName = bItem["eName"].toString().toUpperCase();
        let nameScore = stringSimilarity(aName, bName) > 0.66;

        let aAddress = aItem["address"].toString().toUpperCase();
        let bAddress = bItem["address"].toString().toUpperCase();
        let aAddressFiltered = filterAddress(aAddress.split(/[s,s;]+/)[0]);
        let bAddressFiltered = filterAddress(bAddress.split(/[s,s;]+/)[0]);
        let addressScore =
          stringSimilarity(aAddressFiltered, bAddressFiltered) > 0.66;

        let aActs = aItem["acts"].toString().toUpperCase();
        let bActs = bItem["acts"].toString().toUpperCase();
        let actScore = aActs == bActs ? true : false;

        let aVenue = aItem["venue"].toString().toUpperCase();
        let bVenue = bItem["venue"].toString().toUpperCase();
        let venueScore = stringSimilarity(aVenue, bVenue) > 0.66 ? true : false;

        let aUrl = aItem["url"].toString().toUpperCase();
        let bUrl = bItem["url"].toString().toUpperCase();
        let urlsEqual = aUrl == bUrl;

        return !urlsEqual && actScore && dateScore && venueScore;
      })
  );
  Log.Debug("filterDupeEvents() filtered out duplicates", reduced);
  return reduced;
};

const filterAltEvents = (newArray, existingArray) => {
  // this filter function tests whether any events share
  // Date, Address, Name, and Venue
  let alternates = newArray.filter((aItem) =>
    existingArray.find((bItem) => {
      let aDate = Utilities.formatDate(
        new Date(aItem["date"]),
        "PST",
        "yyyy/MM/dd"
      );
      let bDate = Utilities.formatDate(
        new Date(bItem["date"]),
        "PST",
        "yyyy/MM/dd"
      );
      let aName = aItem["eName"].toString().toUpperCase();
      let bName = bItem["eName"].toString().toUpperCase();
      let aAddress = aItem["address"].toString().toUpperCase();
      let bAddress = bItem["address"].toString().toUpperCase();
      let aAddressFiltered = filterAddress(aAddress.split(/[s,s;]+/)[0]);
      let bAddressFiltered = filterAddress(bAddress.split(/[s,s;]+/)[0]);
      let aVenue = aItem["venue"].toString().toUpperCase();
      let bVenue = bItem["venue"].toString().toUpperCase();
      let aUrl = aItem["url"].toString().toUpperCase();
      let bUrl = bItem["url"].toString().toUpperCase();
      // if ((aAddressSplit.indexOf(bAddress) > -1 || bAddressSplit.indexOf(aAddress) > -1) || (aVenue.indexOf(bVenue) > -1 || bVenue.indexOf(aVenue) > -1)) Logger.log(`Address match or Venue Match: ${aName}, ${bName}`)
      return (
        aUrl != bUrl &&
        (aName.indexOf(bName > -1) || bName.indexOf(aName) > -1) &&
        (aAddressFiltered.indexOf(bAddress) > -1 ||
          bAddressFiltered.indexOf(aAddress) > -1 ||
          aVenue.indexOf(bVenue) > -1 ||
          bVenue.indexOf(aVenue) > -1) &&
        aDate == bDate
      );
    })
  );
  Log.Debug(
    "filterAltEvents() exist but are from a different vendor",
    alternates
  );
  return alternates;
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Search a sheet's column for a value - if found, returns TRUE, if not found, returns FALSE
 * @param {sheet} sheet
 * @param {string} columnName
 * @param {string} val value to search for
 */
const searchColForValue = (sheet, columnName, val) => {
  if (typeof sheet != `object`) return false;
  try {
    let data = sheet.getDataRange().getValues();
    let lastRow = sheet.getLastRow();
    let col = data[0].indexOf(columnName);
    let range = sheet.getRange(2, col + 1, lastRow, 1).getValues();
    // Logger.log(range);
    if (col != -1) {
      let isSearchStringInRange = range.some(function (row) {
        return row[0] === val;
      });
      return isSearchStringInRange;
    } else {
      console.error(`Matching data by header failed...`);
      return false;
    }
  } catch (err) {
    console.error(
      `${err} : searchForValue failed - Sheet: ${sheet} Col Name specified: ${columnName} value: ${val}`
    );
    return false;
  }
};

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
  try {
    const data = sheet.getDataRange().getValues();
    const col = data[0].indexOf(columnName) + 1;
    if (col == -1) return false;
    sheet.getRange(row, col).setValue(val);
    return 0;
  } catch (err) {
    Logger.log(
      `${err} : SetByHeader failed - Sheet: ${sheet} Row: ${row} Col: ${col} Value: ${val}`
    );
    console.error(
      `${err} : SetByHeader failed - Sheet: ${sheet} Row: ${row} Col: ${col} Value: ${val}`
    );
    return 1;
  }
};

/**
 * ------------------------------------------------------------------------------------------------------
 * Compares two strings and returns a percentage of how similar the two are
 * @param {string} s1
 * @param {string} s2
 * @returns {float} score
 */
const stringSimilarity = (s1, s2) => {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (
    (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)
  );
};
/**
 * ------------------------------------------------------------------------------------------------------
 * Writes a row of data to a sheet. Input event data and it writes each value to the sheet with matching header name
 * @param {sheet} sheet
 * @param {dict} data
 */
// const SetRowData = (sheet,data) =>
// {
//   if(typeof sheet != `object`) return 1;
//   try {
//     let sheetHeaderNames = Object.values(GetRowData(sheet, 1));
//     let values = [];
//       Object.entries(data).forEach(pair =>
//       {
//         let headername = HEADERNAMES[pair[0]];
//         let index = sheetHeaderNames.indexOf(headername);
//         values[index] = pair[1];
//       })
//     sheet.appendRow(values);
//   } catch (err) {
//     console.error(`${err} : SetRowData failed - Sheet: ${sheet}`);
//     return 1;
//   }
// }

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Write a list (1D) vertically into a column on a sheet
 * @param {array} array a 1D array
 * @param {object} sheet
 * @param {integer} col column number
 */
const writeArrayToColumn = (array, sheet, col) => {
  let outerArray = [],
    tempArray = [],
    i = 0;

  try {
    for (i = 0; i < array.length; i += 1) {
      tempArray = [];
      tempArray.push(array[i]);
      outerArray.push(tempArray);
    }
    let range = sheet.getRange(sheet.getLastRow() + 1, col, array.length, 1);
    range.setValues(outerArray);
  } catch (err) {
    console.error(
      `${err} : writeArrayToColumn failed - Sheet: ${sheet}, Array: ${array}, Col: ${col}`
    );
  }
};

/**
 * ------------------------------------------------------------------------------------------------------
 * Removes blank rows on a sheet
 * @param {sheet} sheet
 */
const deleteEmptyRows = (sheet) => {
  // if(typeof sheet != `object`) return 1;
  try {
    if (sheet == undefined) sheet = SpreadsheetApp.getActiveSheet();
    if (sheet.getLastRow() > 1) {
      // Gets active selection and dimensions.
      let activeRange = sheet.getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        sheet.getLastColumn()
      );
      let rowCount = activeRange.getHeight();
      let firstActiveRow = activeRange.getRow();
      let columnCount = sheet.getMaxColumns();

      // Tests that the selection is a valid range.
      if (rowCount < 1) {
        Logger.log("Select a valid range.");
        return;
      }
      // Tests active range isn't too large to process. Enforces limit set to 10k.
      if (rowCount > 10000) {
        Logger.log(
          "Selected range too large. Select up to 10,000 rows at one time."
        );
        return;
      }

      // Utilizes an array of values for efficient processing to determine blank rows.
      let activeRangeValues = activeRange.getValues();

      // Checks if array is all empty values.
      let valueFilter = (value) => value !== "";
      let isRowEmpty = (row) => {
        return row.filter(valueFilter).length === 0;
      };

      // Maps the range values as an object with value (to test) and corresponding row index (with offset from selection).
      let rowsToDelete = activeRangeValues
        .map((row, index) => ({
          row,
          offset: index + activeRange.getRowIndex(),
        }))
        .filter((item) => isRowEmpty(item.row)) // Test to filter out non-empty rows.
        .map((item) => item.offset); //Remap to include just the row indexes that will be removed.

      // Combines a sorted, ascending list of indexes into a set of ranges capturing consecutive values as start/end ranges.
      // Combines sequential empty rows for faster processing.
      let rangesToDelete = rowsToDelete.reduce((ranges, index) => {
        let currentRange = ranges[ranges.length - 1];
        if (currentRange && index === currentRange[1] + 1) {
          currentRange[1] = index;
          return ranges;
        }
        ranges.push([index, index]);
        return ranges;
      }, []);

      // Sends a list of row indexes to be deleted to the console.
      Log.Debug(`ranges to delete`, rangesToDelete);

      // Deletes the rows using REVERSE order to ensure proper indexing is used.
      rangesToDelete
        .reverse()
        .forEach(([start, end]) => sheet.deleteRows(start, end - start + 1));
      SpreadsheetApp.flush();
    } else {
      Log.Debug(`No text on the sheet - no empty rows to remove`);
    }
  } catch (err) {
    console.error(`${err} : deleteEmptyRows failed - Sheet: ${sheet} ${err}`);
  }
};

/**
 * Removes blank columns in a selected range.
 *
 * Cells containing Space characters are treated as non-empty.
 * The entire column, including cells outside of the selected range,
 * must be empty to be deleted.
 *
 * Called from menu option.
 */
const deleteEmptyColumns = (sheet) => {
  try {
    if (sheet == undefined) sheet = SpreadsheetApp.getActiveSheet();
    // Gets active selection and dimensions.
    let activeRange = sheet.getActiveRange();
    Logger.log(activeRange);
    let rowCountMax = sheet.getMaxRows();
    let columnWidth = activeRange.getWidth();
    let firstActiveColumn = activeRange.getColumn();

    // Tests that the selection is a valid range.
    if (columnWidth < 1) {
      Logger.log("Select a valid range.");
      return;
    }
    // Tests active range is not too large to process. Enforces limit set to 1k.
    if (columnWidth > 1000) {
      Logger.log(
        "Selected range too large. Select up to 10,000 rows at one time."
      );
      return;
    }

    // Utilizes an array of values for efficient processing to determine blank columns.
    let activeRangeValues = sheet
      .getRange(1, firstActiveColumn, rowCountMax, columnWidth)
      .getValues();

    // Transposes the array of range values so it can be processed in order of columns.
    let activeRangeValuesTransposed = activeRangeValues[0].map((_, colIndex) =>
      activeRangeValues.map((row) => row[colIndex])
    );

    // Checks if array is all empty values.
    let valueFilter = (value) => value !== "";
    let isColumnEmpty = (column) => {
      return column.filter(valueFilter).length === 0;
    };

    // Maps the range values as an object with value (to test) and corresponding column index (with offset from selection).
    let columnsToDelete = activeRangeValuesTransposed
      .map((column, index) => ({ column, offset: index + firstActiveColumn }))
      .filter((item) => isColumnEmpty(item.column)) // Test to filter out non-empty rows.
      .map((item) => item.offset); //Remap to include just the column indexes that will be removed.

    // Combines a sorted, ascending list of indexes into a set of ranges capturing consecutive values as start/end ranges.
    // Combines sequential empty columns for faster processing.
    let rangesToDelete = columnsToDelete.reduce((ranges, index) => {
      let currentRange = ranges[ranges.length - 1];
      if (currentRange && index === currentRange[1] + 1) {
        currentRange[1] = index;
        return ranges;
      }
      ranges.push([index, index]);
      return ranges;
    }, []);

    // Sends a list of column indexes to be deleted to the console.
    console.log(rangesToDelete);

    // Deletes the columns using REVERSE order to ensure proper indexing is used.
    rangesToDelete
      .reverse()
      .forEach(([start, end]) => sheet.deleteColumns(start, end - start + 1));
    SpreadsheetApp.flush();
  } catch (err) {
    console.error(
      `${err} : deleteEmptyColumns failed - Sheet: ${sheet} ${err}`
    );
  }
};

/**
 * A helper function to display messages to user.
 *
 * @param {string} message - Message to be displayed.
 * @param {string} caller - {Optional} text to append to title.
 */
const showMessage = (message, title) => {
  try {
    let ui = SpreadsheetApp.getUi();
    ui.alert(title, message, ui.ButtonSet.OK);
  } catch (err) {
    console.error(
      `${err} : showMessage failed - Message: "${message}", title: "${title}"`
    );
  }
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * writeAltEventsToSheet
 * Write new URL to an existing event
 * @param {array} eventsArr [{name, date, city, venue, url, image, acts}]
 */
const writeAltEventsToSheet = async (altEvents) => {
  const sheet = EVENT_SHEET;
  try {
    // Get sheet data
    const data = sheet.getDataRange().getValues();
    // Get column numbers for Name, Date, Venue, and Address
    const colDate = data[0].indexOf(HEADERNAMES.date);
    const colName = data[0].indexOf(HEADERNAMES.eName);
    const colVenue = data[0].indexOf(HEADERNAMES.venue);
    const colAddress = data[0].indexOf(HEADERNAMES.address);
    const colUrl = data[0].indexOf(HEADERNAMES.url);
    const colAlt = data[0].indexOf(HEADERNAMES.url2);
    if (colDate == -1 || colName == -1 || colVenue == -1 || colAddress == -1) {
      // sheet.getRange(row, col).setValue(val);
      throw new Error(
        "Unable to locate column names that should be on the Events Sheet"
      );
    }
    const activeRange = sheet.getRange(
      2,
      1,
      sheet.getLastRow() - 1,
      sheet.getLastColumn()
    );
    const lastRow = sheet.getLastRow() - 1; //subtract header
    if (lastRow < 1) throw new Error("No events found on Events Sheet");
    const existing = activeRange.getValues();
    let row = 0;
    // Loop through existing events
    for (let i = 0; i < existing.length; i++) {
      let aItem = existing[i];
      let aUrl = aItem[colUrl];
      row = i + 2;
      // Logger.log(`AltEvents length: ${altEvents.length}`);
      let altUrl = aItem[colAlt];
      // Only search for a second URL if one doesn't already exist
      if (altUrl != "") {
        let aDate = Utilities.formatDate(
          new Date(aItem[colDate]),
          "PST",
          "yyyy/MM/dd"
        );
        let aName = aItem[colName].toString().toUpperCase();
        let aAddress = aItem[colAddress].toString().toUpperCase();
        let aAddressFiltered = filterAddress(aAddress.split(/[s,s;]+/)[0]);
        let aVenue = aItem[colVenue].toString().toUpperCase();
        // Loop through new results
        for (let j = 0; j < altEvents.length; j++) {
          let bItem = altEvents[j];

          let bDate = Utilities.formatDate(
            new Date(bItem["date"]),
            "PST",
            "yyyy/MM/dd"
          );

          let bName = bItem["eName"].toString().toUpperCase();
          let bAddress = bItem["address"].toString().toUpperCase();
          let bAddressFiltered = filterAddress(bAddress.split(/[s,s;]+/)[0]);
          let bVenue = bItem["venue"].toString().toUpperCase();
          let bUrl = bItem["url"];
          // let aUrl = aItem["url"].toString().toUpperCase();
          // check if the existing event matches event name, date, and venue, and address of the result
          if (
            (aName.indexOf(bName > -1) || bName.indexOf(aName) > -1) &&
            (aAddressFiltered.indexOf(bAddress) > -1 ||
              bAddressFiltered.indexOf(aAddress) > -1 ||
              aVenue.indexOf(bVenue) > -1 ||
              bVenue.indexOf(aVenue) > -1) &&
            aDate == bDate &&
            aUrl != bUrl
          ) {
            Log.Debug(
              `writeAltEventsToSheet() - Existing event -  Row: ${row}, Name: ${aName}`
            );
            let bUrl = bItem["url"].toString();
            CommonLib.setByHeader(EVENT_SHEET, HEADERNAMES.url2, row, bUrl);
          }
        }
      }
    }
  } catch (err) {
    Logger.log(`writeAltEventsToSheet() error: ${err}`);
    console.error(`writeAltEventsToSheet() error: ${err}`);
  }
};

/**
 * ----------------------------------------------------------------------------------------------------------------
 * writeEventsToSheet
 * Write an array of events to sheet
 * @param {array} eventsArr [{name, date, city, venue, url, image, acts}]
 */
const writeEventsToSheet = async (eventsArr) => {
  for (const [index, [key]] of Object.entries(Object.entries(eventsArr))) {
    CommonLib.setRowData(EVENT_SHEET, HEADERNAMES, eventsArr[key]);
  }
};

const test = () => {
  CommonLib.setByHeader(EVENT_SHEET, HEADERNAMES.eName, 25, "Test");
};
