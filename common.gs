// Common GAS Functions
// v2.2.0 - 2021-10-04

const common = {
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
        console.error(input + " = " + error);
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
const arrUnique = (array) => 
{
  if (array.length < 1) 
  {
    Logger.log("Array length 0 - arrUnique");
    return [];
  }
  try 
  {
    let outArray = [];
    array.sort();
    outArray.push(array[0]);
    for(let n in array)
    {
      // Logger.log(outArray[outArray.length-1]+'  =  '+array[n]+' ?');
      if(outArray[outArray.length-1]!=array[n])
      {
        outArray.push(array[n]);
      }
    }
    return outArray;
  } catch (err) {
    return [];
  }
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
    console.info(`${valueName}: ${value}`);
  }
}

/**
 * ----------------------------------------------------------------------------------------------------------------
 * Return TRUE if number is even, FALSE if it is odd
 * @param {number} n
 */
const isEven = (n) => 
{
   return n % 2 == 0;
}