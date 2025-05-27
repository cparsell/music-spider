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
  let results = [];
  let artistRows = SHEETS.ARTISTS.getLastRow() - 1;
  if (artistRows == 0) artistRows = 1;
  const artistsArr = SHEETS.ARTISTS.getRange(2, 1, artistRows, 1).getValues();

  for (let i = 0; i < artistsArr.length; i++) {
    results.push(artistsArr[i][0]);
  }
  // if searchManuallyAdded = TRUE, include artists in 'Artists (Custom)' sheet in the search
  if (Config.searchManuallyAdded()) {
    let customArtistRows = SHEETS.CUSTOM_ARTIST.getLastRow() - 1;
    let manualArtistsArr = SHEETS.CUSTOM_ARTIST.getRange(
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
 * Remove duplicates from an array
 * @param {array} array
 * @returns {array} array
 */
const buildEventsArr = () => {
  try {
    const lastRow = SHEETS.EVENTS.getLastRow();
    let events = [];

    if (lastRow > 1) {
      for (i = 1; i < lastRow; i++) {
        let rowData = CommonLib.getRowData(SHEETS.EVENTS, HEADERNAMES, i + 1);
        let { date } = rowData;
        date = new Date(date);
        // let formattedDate = Utilities.formatDate(newDate, `PST`,`MM-dd-yyyy hh:mm a`);
        let eventDate = Utilities.formatDate(date, "PST", "yyyy/MM/dd HH:mm");
        rowData.date = eventDate;
        events.push(rowData);
      }

      // Sort by key, which is the date
      const ordered = events.sort(function (a, b) {
        return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      });

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
 * Create event for selected event or events
 * @param {object} events
 */
const createSelectedCalEvents = () => {
  const eventSheet = SHEETS.EVENTS;
  const selectedRange = eventSheet.getActiveRange();
  const selectedRows = selectedRange.getRow(); // selected row number
  const selectedNumRows = selectedRange.getNumRows(); // total number of rows in the selection
  const numColumns = eventSheet.getLastColumn(); // Get total number of columns

  // Get all values from the range covering the selected rows and all columns
  const values = eventSheet
    .getRange(selectedRows, 1, selectedNumRows, numColumns)
    .getValues();
  const headers = eventSheet.getRange(1, 1, 1, numColumns).getValues()[0]; // Fetch all headers
  const events = values.map((row) => {
    let event = {};
    headers.forEach((header, index) => {
      const key = Object.keys(HEADERNAMES).find(
        (key) => HEADERNAMES[key] === header
      );
      if (key) {
        event[key] = row[index];
      }
    });
    return event;
  });

  const names = events.map((event) => event.eName);
  console.info(`Creating calendar event(s) for: ${names.join(", ")}`);
  createCalEvents(events);
};

const testIgnored = () => {
  console.log(getIgnoredArtists());
}

const getIgnoredArtists = () => {
  let ignored = [];
  try {
    let artistRows = SHEETS.IGNORED.getLastRow() - 1;
    if (artistRows <= 0) {
      Log.Warning(`getIgnoredArtists() No Ignored Artists found in "Ignored Artists" sheet`);
      return [];
    }
    const sheetVals = SHEETS.IGNORED.getRange(2, 1, artistRows, 1).getValues();

    for (let i = 0; i < sheetVals.length; i++) {
      ignored.push(sheetVals[i][0]);
    }
    return ignored;
  } catch (error) {
    console.error (`getIgnoredArtists() error: ${error}`);
    return ignored;
  }
}

const addIgnoredArtists = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  if (sheet.getSheetName() == "Ignored Artists") {
    console.warn("User is trying to add an ignored artist to the Ignored Artists - Skipping...");
    return;
  }
  const ignoredSheetName = "Ignored Artists";
  let ignoredSheet = SHEETS.IGNORED;

  // Create the "Ignored Artists" sheet if it doesn't exist.
  if (!ignoredSheet) {
    ignoredSheet = ss.insertSheet(ignoredSheetName);
    ignoredSheet.appendRow(['Artist']); // Add a header row.
  }

  // Get selected range in the active sheet.
  const range = sheet.getActiveRange();
  const selectedValues = range.getValues().flat(); // Flatten in case of multiple rows.

  // Get the existing ignored artists as a set for faster lookup.
  const ignoredArtists = new Set(getIgnoredArtists());

  // Append each selected artist to the "Ignored Artists" sheet if not already ignored.
  selectedValues.forEach(artist => {
    if (artist && !ignoredArtists.has(artist)) {
      ignoredSheet.appendRow([artist]);
    }
  });

  Logger.log(`${selectedValues.length} artist(s) checked and added to "${ignoredSheetName}" if not already present.`);
}

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

    const col = data[0].indexOf(dateHeaderName);
    if (col == -1) {
      throw new Error(`Matching data by header failed...`);
    }

    let range = sheet.getRange(2, col + 1, lastRow, 1).getValues();
    let rowsToDel = [];

    for (let i = 0; i < range.length; i++) {
      let date = new Date(range[i][0]);
      if (date <= today) {
        rowsToDel.push(i + 2);
      }
    }

    // Delete from bottom to top to prevent changing indices
    rowsToDel.reverse().forEach(rowNum => {
      Log.Info(`Removing expired event: ${data[rowNum - 1][0]}, Date: ${range[rowNum - 2]}`);
      console.info(`Deleting row ${rowNum}`);
      sheet.deleteRow(rowNum);
    });
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

function testStringSim() {
  Logger.log(CommonLib.stringSimilarity("The Regency", "The Rgeency Ballroom"));
}

/**
 * Split addresses at the first comma or semicolon
    And replace 'St.' or 'Street' with 'St'
    Returns something like: 1290 Sutter Street
    This reduces false negatives if Ticketmaster shows CA but another shows it as California
 * @param address 
 * @returns 
 */
const filterAddress = (address) => {
  if (address) {
    try {
      filtered = address.replace(/(Avenue|Ave[.]?)/g, "Ave");
      filtered = address.replace(/(Street|St[.]?)/g, "St");
      filtered = address.replace(/(Drive|Dr[.]?)/g, "Dr");
      filtered = address.replace(/(Road|Rd[.]?)/g, "Rd");
      return filtered;
    } catch (err0r) {
      Log.Error(`filterAddress() error: ${err0r}`);
    }
  } else {
    Log.Debug("filterAddress() - address is null");
    return "";
  }
};
/**
 * ----------------------------------------------------------------------------------------------------------------
 * Filter list of new events to exclude ones that already exist on the Events Sheet
 * Either:
 *  A. URLs are the same OR
 *  B. the event NAMES, ADDRESSES, and DATES are the same
 * In the case of B, it will add the URL to the URL2 column so one can choose from multiple ticket vendors
 * @param {Array} newArray list of new results
 * @param {Array} existingArray list of existing events
 * @returns {Array} the filtered array
 */
const filterDupeEvents = (newArray, existingArray) => {
  try {
    // Ensure inputs are arrays
    if (!Array.isArray(newArray) || !Array.isArray(existingArray)) {
      throw new Error("Both newArray and existingArray must be arrays.");
    }
    // this filter function tests whether a "very similar" event exists already and returns the filtered array

    let reduced = newArray.filter(
      (aItem) =>
        // Check if a very similar event exists in the existingArray
        !existingArray.find((bItem) => {
          let aDate, bDate;
          try {
            aDate = Utilities.formatDate(
              new Date(aItem["date"]),
              "PST",
              "yyyy/MM/dd"
            );
            bDate = Utilities.formatDate(
              new Date(bItem["date"]),
              "PST",
              "yyyy/MM/dd"
            );
          } catch (error) {
            Logger.log(`Error formatting date: ${error.message}`);
            return false; // Skip this comparison if there's an error with date formatting
          }
          let dateScore = aDate === bDate;

          // Extract and compare event names
          let aName = aItem["eName"]
            ? aItem["eName"].toString().toUpperCase()
            : "";
          let bName = bItem["eName"]
            ? bItem["eName"].toString().toUpperCase()
            : "";
          // let nameScore = CommonLib.stringSimilarity(aName, bName) > 0.5;

          // Extract and compare acts
          let aActs = aItem["acts"]
            ? CommonLib.sortArrayAlpha(aItem["acts"].split(",")).join()
            : "";
          let bActs = bItem["acts"]
            ? CommonLib.sortArrayAlpha(bItem["acts"].split(",")).join()
            : "";

          let actScore = CommonLib.stringSimilarity(aActs, bActs) > 0.66;

          // Extract and compare venue names
          let aVenue = aItem["venue"]
            ? aItem["venue"].toString().trim().toUpperCase()
            : "";
          let bVenue = bItem["venue"]
            ? bItem["venue"].toString().trim().toUpperCase()
            : "";

          let venueScore = CommonLib.stringSimilarity(aVenue, bVenue) > 0.5;

          // Extract and compare URLs
          let aUrl = aItem["url"] ? aItem["url"].toString().toUpperCase() : "";
          let bUrl = bItem["url"] ? bItem["url"].toString().toUpperCase() : "";

          let urlsEqual = aUrl === bUrl;

          Log.Debug(
            `new: ${aName}, ex: ${bName}, urlsEqual: ${urlsEqual}, actScore: ${actScore}, dateScore: ${dateScore}, venueScore: ${venueScore}`
          );
          // Urls match, act lists match, dates are match,
          // and venue names are very similar (accounting for differences in listing the name)
          return urlsEqual || (actScore && dateScore && venueScore);
        })
    );
    Log.Debug("filterDupeEvents() filtered out duplicates", reduced);
    return reduced;
  } catch (error) {
    Logger.log(`Error in filterDupeEvents function: ${error.message}`);
    return []; // Return an empty array in case of error
  }
};

/**
 * Filters events from newArray that share Date, Address, Name, and Venue with events in existingArray.
 * @param {Array} newArray - The array of new events to filter.
 * @param {Array} existingArray - The array of existing events to compare against.
 * @returns {Array} The filtered array of alternate events.
 */
const filterAltEvents = (newArray, existingArray) => {
  try {
    console.info("filterAltEvents() starting");
    // Ensure inputs are arrays
    if (!Array.isArray(newArray) || !Array.isArray(existingArray)) {
      throw new Error("Both newArray and existingArray must be arrays.");
    }

    let alternates = newArray.filter((aItem) => {
      // console.info('aItem');
      // console.info(aItem);
      try {
        return existingArray.find((bItem) => {
          // console.info('bItem');
          // console.info(bItem);
          // Extract and format dates
          let aDate = "";
          let bDate = "";
          try {
            aDate = aItem["date"]
              ? Utilities.formatDate(
                  new Date(aItem["date"]),
                  "PST",
                  "yyyy/MM/dd"
                )
              : "";
            bDate = bItem["date"]
              ? Utilities.formatDate(
                  new Date(bItem["date"]),
                  "PST",
                  "yyyy/MM/dd"
                )
              : "";
          } catch (error) {
            Logger.log(`Error formatting date: ${error.message}`);
            return false; // Skip comparison if date formatting fails
          }
          let datesEqual = aDate === bDate;

          let aName = aItem["eName"] ? aItem["eName"].toString().trim() : "";
          let bName = bItem["eName"] ? bItem["eName"].toString().trim() : "";
          // Compare acts
          let aActs = aItem["acts"]
            ? CommonLib.sortArrayAlpha(
                aItem["acts"].toString().split(",")
              ).join()
            : "";
          let bActs = bItem["acts"]
            ? CommonLib.sortArrayAlpha(
                bItem["acts"].toString().split(",")
              ).join()
            : "";
          // console.info(`aActs: ${aActs}`);
          // console.info(`bActs: ${bActs}`);
          let actsScore = CommonLib.stringSimilarity(aActs, bActs) > 0.6;

          // Compare addresses
          let aAddress = aItem["address"]
            ? aItem["address"].toString().trim().toUpperCase()
            : "";
          let bAddress = bItem["address"]
            ? bItem["address"].toString().trim().toUpperCase()
            : "";
          let aAddressFiltered = filterAddress(aAddress.split(/[s,s;]+/)[0]);
          let bAddressFiltered = filterAddress(bAddress.split(/[s,s;]+/)[0]);
          // console.info(`aAddress: ${aAddress}`);
          // console.info(`bAddress: ${bAddress}`);
          let addressScore =
            CommonLib.stringSimilarity(aAddressFiltered, bAddressFiltered) >
            0.5;

          // Compare venue names
          let aVenue = aItem["venue"]
            ? aItem["venue"].toString().trim().toUpperCase()
            : "";
          let bVenue = bItem["venue"]
            ? bItem["venue"].toString().trim().toUpperCase()
            : "";
          // console.info(`aVenue: ${aVenue}`);
          // console.info(`bVenue: ${bVenue}`);
          let venueScore = CommonLib.stringSimilarity(aVenue, bVenue) > 0.5;

          // Compare URLs
          let aUrl = aItem["url"]
            ? aItem["url"].toString().trim().toUpperCase()
            : "";
          let bUrl = bItem["url"]
            ? bItem["url"].toString().trim().toUpperCase()
            : "";
          // console.info(`aUrl: ${aUrl}`);
          // console.info(`bUrl: ${bUrl}`);
          let urlsEqual = aUrl === bUrl;
          // Logger.log(`Comparing events - URLs Equal: ${urlsEqual},
          // Act Score: ${actsScore}, Date Score: ${datesEqual},
          // Address Score: ${addressScore}, Venue Score: ${venueScore}`);
          Log.Debug(
            `existing: ${aName}, new: ${bName}, urlsEqual: ${urlsEqual}, actScore: ${actsScore}, dateScore: ${datesEqual}, addressScore: ${addressScore}, venueScore: ${venueScore}`
          );

          return (
            !urlsEqual &&
            actsScore &&
            datesEqual &&
            (addressScore || venueScore)
          );
        });
      } catch (error) {
        Logger.log(`Error comparing events: ${error.message}`);
        return false; // Skip this item in case of any comparison errors
      }
    });
    Log.Debug(
      "filterAltEvents() exist but are from a different vendor",
      alternates
    );

    return alternates;
  } catch (error) {
    Logger.log(`Error in filterAltEvents function: ${error.message}`);
    return []; // Return an empty array in case of an error
  }
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
  const sheet = SHEETS.EVENTS;
  try {
    // Get sheet data
    const data = sheet.getDataRange().getValues();
    // Get column numbers for Name, Date, Venue, and Address
    const colDate = data[0].indexOf(HEADERNAMES.date);
    const colName = data[0].indexOf(HEADERNAMES.eName);
    const colVenue = data[0].indexOf(HEADERNAMES.venue);
    const colAddress = data[0].indexOf(HEADERNAMES.address);
    const colActs = data[0].indexOf(HEADERNAMES.acts);
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
      if (altUrl == "") {
        let aDate = Utilities.formatDate(
          new Date(aItem[colDate]),
          "PST",
          "yyyy/MM/dd"
        );
        let aName = aItem[colName];
        let aAddress = aItem[colAddress].toUpperCase();
        let aAddressFiltered = filterAddress(aAddress.split(/[s,s;]+/)[0]);
        let aVenue = aItem[colVenue];
        let aActs = aItem[colActs];
        // Loop through new results
        for (let j = 0; j < altEvents.length; j++) {
          let bItem = altEvents[j];
          let bDate = Utilities.formatDate(
            new Date(bItem["date"]),
            "PST",
            "yyyy/MM/dd"
          );
          let bName = bItem["eName"];
          // Logger.log(`writeAlt() ex:${aName}, new: ${bName}`);
          let bAddress = bItem["address"];
          let bAddressFiltered = filterAddress(bAddress.split(/[s,s;]+/)[0]);
          let bVenue = bItem["venue"];
          let bUrl = bItem["url"];
          let bActs = bItem["acts"];
          // Conditionals
          let datesEqual = aDate == bDate;
          let nameScore = CommonLib.stringSimilarity(aName, bName) > 0.5;
          let addressScore =
            CommonLib.stringSimilarity(aAddressFiltered, bAddressFiltered) >
            0.5;
          let venueScore = CommonLib.stringSimilarity(aVenue, bVenue) > 0.5;
          let urlScore = CommonLib.stringSimilarity(aUrl, bUrl) > 0.7; // URLs are very similar
          let actScore = CommonLib.stringSimilarity(aActs, bActs) > 0.6;
          // Logger.log(
          //   `ex: ${aName}, new: ${bName}, urlsEqual: ${urlsEqual}, actScore: ${actScore}, dateScore: ${datesEqual}, addressScore: ${addressScore}, venueScore: ${venueScore}`
          // );

          // if the existing event matches event name, date, and venue, and address of the result & URLS are not "very similar"
          if (
            !urlScore &&
            actScore &&
            datesEqual &&
            (addressScore || venueScore)
          ) {
            Log.Info(
              `writeAltEventsToSheet() - Writing alt URL for event '${aName}' in row: ${row}`
            );
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
