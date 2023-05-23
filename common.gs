/**
 * ----------------------------------------------------------------------------------------------------------------
 * Common GAS functions - some functions written by https://github.com/nitemice
 * Common.parsePathParameters
 * Common.trim
 * Common.stripXml
 * Common.prettifyJson
 * Common.collateArrays
 * Common.arrayRemoveDupes
 * Common.isEven
 */
const Common = {
  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Parse URL path parameters
   * @param {string} request
   */
  parsePathParameters: (request) =>
  {
    // If there's only one parameter, just treat it as a path
    if (!request.queryString.match(/\=/))
    {
      return request.queryString;
    }
    // Look for a parameter called "path"
    return request.parameter.path || "";
  },

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Strip spaces, no-break spaces, zero-width spaces,
   * & zero-width no-break spaces
   * @param {string} string
   */
  trim: (string) =>
  {
    let pattern = /(^[\s\u00a0\u200b\uFEFF]+)|([\s\u00a0\u200b\uFEFF]+$)/g;
    return string.replace(pattern, "");
  },
  
  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Retrieve text from inside XML tags
   * @param {string} input
   */
  stripXml: (input) =>
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
        console.error(input + " = " + error);
      }

      return pre + inside + post;
    }
    return input;
  },

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Convert a JSON string to a pretty-print JSON string
   * @param {string} input
   */
  prettifyJson: function(input)
  {
      return JSON.stringify(JSON.parse(input), null, 4);
  },

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Collate objects at given path, from array of JSON strings
   * @param {array} path
   * @param {object} objects
   */
  collateArrays: (path, objects) =>
  {
    let outArray = [];
    let chunks = path.split('.');

    // Iterate over each object
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
  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Remove duplictes from an array
   * @param {array} array
   */
  arrayRemoveDupes: (array) =>
  {
    if (array.length < 1) 
    {
      Logger.log("Array length 0 - Common.arrayRemoveDupes");
      return [];
    }
    try 
    {
      let outArray = [];
      array.sort();
      outArray.push(array[0]);
      for(let n in array)
      {
        if(outArray[outArray.length-1]!=array[n])
        {
          outArray.push(array[n]);
        }
      }

      return outArray;
    } catch (err) {
      return [];
    }
  },

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Return TRUE if number is even, FALSE if it is odd
   * @param {number} n
   */
  isEven: (n) => n % 2 == 0,

  /**
   * ----------------------------------------------------------------------------------------------------------------
   * Async await decorator to return its response time 
   * @param {function} fn
   */
  dataResponseTime: (fn) => {
    return async (accessToken, url, writer, getAllPages) => {
      console.time('fn');
      const data = await fn(accessToken, url, writer, getAllPages);
      console.timeEnd('fn');
      return data;
    }
  },
};



/**
 * ----------------------------------------------------------------------------------------------------------------
 * Log a value to Execution Log if Config.debug = true
 * @param {string} valueName "variable"
 * @param {variable} value the variable itself
 */
// const debugLog = (valueName, value) => 
// {
//   if (Config.DEBUG) 
//   {
//     console.info(`${valueName}: ${value}`);
//   }
// }

