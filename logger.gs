
/**
 * ----------------------------------------------------------------------------------------------------------------
 * Class for Writing a Log
 */
class Log {
  constructor() { 

  }

  /**
   * Error Message
   * @param {string} message
   */
  static Error(message, obj = null) {
    try{
      if (obj) message = `${message}: ${JSON.stringify(obj)}`;
      let date = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      let text = [date, "ERROR!", message, ];
      OTHERSHEETS.Logger.appendRow(text);
      console.error(`${text[0]}, ${text[1]} : ${message}`);
      this.prototype._PopItem();
      this.prototype._CleanupSheet();
      return 0;
    } catch(err) {
      console.error(`"Error()" failed : ${err}`);
      return 1;
    }
  }

  /**
   * Warning Message
   * @param {string} message
   * @param {object} obj optional object to be logged as a string
   */
  static Warning(message, obj = null) {
    try{
      if (obj) message = `${message}: ${JSON.stringify(obj)}`;
      let date = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      let text = [date, "INFO", message];
      OTHERSHEETS.Logger.appendRow(text);
      console.warn(`${text[0]}, ${text[1]} : ${message}`);
      this.prototype._PopItem();
      this.prototype._CleanupSheet();
      return 0;
    } catch(err) {
      console.error(`"Warning()" failed : ${err}`);
      return 1;
    }
  }

  /**
   * Info Message
   * @param {string} message
   * @param {object} obj optional object to be logged as a string
   */
  static Info(message, obj = null) {
    try {
      if (obj) message = `${message}: ${JSON.stringify(obj)}`;
      let date = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      let text = [date, "INFO", message];
      OTHERSHEETS.Logger.appendRow(text);
      console.info(`${text[0]}, ${text[1]} : ${message}`);
      this.prototype._PopItem();
      this.prototype._CleanupSheet();
      return 0;
    } catch(err) {
      console.error(`"Info()" failed : ${err}`);
      return 1;
    }
  }

  /**
   * Debug Message
   * @param {string} message
   * @param {object} obj optional object to be logged as a string
   */
  static Debug(message, obj = null) {
    if (Config.DEBUG){
      try {
        if (obj) message = `${message}: ${JSON.stringify(obj)}`;
        let date = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
        let text = [date, "DEBUG", message];
        OTHERSHEETS.Logger.appendRow(text);
        console.log(`${text[0]}, ${text[1]} : ${message}`);
        this.prototype._PopItem();
        this.prototype._CleanupSheet();
        return 0;
      } catch(err) {
        console.error(`"Debug()" failed : ${err}`);
        return 1;
      }
    }
  }

  /** @private */
  _PopItem() {
    try {
      if(OTHERSHEETS.Logger.getLastRow() >= 500) OTHERSHEETS.Logger.deleteRow(2);
      return 0;
    } catch(err) {
      console.error(`"PopItem()" failed : ${err}`);
      return 1;
    }
  }
  
  /** @private */
  _CleanupSheet() {
    try {
      if(OTHERSHEETS.Logger.getLastRow() > 2000) OTHERSHEETS.Logger.deleteRows(2, 1998);
      return 0;
    } catch(err) {
      console.error(`Whoops ---> ${err}`);
      return 1;
    }
  }
  
}


const _testWrite = () => {
  for(let i = 0; i < 2; i++) {
    Log.Info(`${i} Some Info...`);
    Log.Warning(`${i} Some Warning....`);
    Log.Error(`${i} Some Error....`);
    Log.Debug(`${i} Some Debug....`);
  }
}

