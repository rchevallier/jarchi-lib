"use strict";

const JFile = Java.type('java.io.File');
const JUrl = Java.type('java.net.URL');

/**
 * Open and read the content of a text file/url, $.fs.write exists, but not read 
 * 
 * @param {string} url either an url or a file path
 * @returns {string} The content of the file
 */
 function read(url) {
  const BufferedReader = Java.type('java.io.BufferedReader');
  const InputStreamReader = Java.type('java.io.InputStreamReader');
  
  let result = "";
  let urlObj = null;

  try {
      urlObj = new JUrl(url);
  } catch (e) {
      // If the URL cannot be built, assume it is a file path.
      urlObj = new JUrl(new JFile(url).toURI().toURL());
  }

  const reader = new BufferedReader(new InputStreamReader(urlObj.openStream()));

  let line = reader.readLine();
  while (line != null) {
      result += line + "\n";
      line = reader.readLine();
  }
  reader.close();

  return result;
}


/**
 * Insure all directories in the path is created
 * @param {string} path the relative (to __SCRIPTS_DIR__) or absolute path
 * @returns {boolean} true if succeed
 */
function mkdirs(path) {
  const file = new JFile(path);
  if (!file.exists()) {
    log.trace(`${path} doesn't exist, trying to create`)
    const result = file.mkdirs();
    log.trace(`creation success = ${result}`)
    return result
  } else {
    return file.isDirectory()
  }
}


/**
 * To extend JSON.stringify more types than Object and Array and simple types
 * 
 * @param {*} key 
 * @param {*} val 
 * @returns {string} a stringified value
 */
function convert_func (key, val) {
    if (val && typeof val === 'function') {
      const WS = /\s+/g
      return String(val).replace(WS, ' ').slice(0, 20) + "...}"
    }
    if (val && val.constructor === RegExp ) {
      return String(val)
    }
    return val
  }

const LogLevel = {
    TRACE: 0,
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
    CRITICAL: 5,
  
    /**
     * return the string label for the level
     * @param {number} level - log level
     */
    toString: function ( level ) {
      for ( let key in LogLevel )
        if ( this[ key ] === level ) return key
      return '?'
    }
  }
  
  const log = {
  
    level: LogLevel.INFO,
  
    clear: function () {
      console.clear();
    },
  
    show: function () {
      console.show();
    },
  
    message: function ( level, ...args ) {
      let msg = ""
      for (let arg of args) {
        if (typeof(arg) == "object") {
          msg += JSON.stringify(arg, convert_func)
        } else {
          msg += arg
        }
      }
      if ( level >= LogLevel.ERROR ) {
        console.error( new Date().toISOString() + " " + LogLevel.toString( level ) + ": " + msg);
      } else {
        console.log( new Date().toISOString() + " " + LogLevel.toString( level ) + ": " + msg);
      }
    },
  
    trace: function ( ...args ) {
      if ( log.level <= LogLevel.TRACE ) log.message( LogLevel.TRACE, ...args );
    },
  
    debug: function ( ...args ) {
      if ( log.level <= LogLevel.DEBUG ) log.message( LogLevel.DEBUG, ...args );
    },
  
    info: function ( ...args ) {
      if ( log.level <= LogLevel.INFO ) log.message( LogLevel.INFO, ...args );
    },
  
    warn: function ( ...args ) {
      if ( log.level <= LogLevel.WARN ) log.message( LogLevel.WARN, ...args );
    },
  
    error: function ( ...args ) {
      if ( log.level <= LogLevel.ERROR ) log.message( LogLevel.ERROR, ...args );
    },
  
    critical: function ( ...args ) {
      if ( log.level <= LogLevel.CRITICAL ) {
        log.message( LogLevel.CRITICAL, ...args );
        exit();
      }
    }
  }
  

/**
* neither console.assert
* 
* @param {boolean} assertion the assertion expression result
* @param {string} msg the msg to display on console when assertion failed
*/
function assert(assertion, msg) {
  if (!assertion) {
      msg = "Assertion failed: " + msg
      console.error(msg)
      throw {message:msg}
  }        
}


const MessageDialog = Java.type('org.eclipse.jface.dialogs.MessageDialog');
// MessageDialog.openConfirm(shell, "Confirm", "Please confirm");
// MessageDialog.openError(shell, "Error", "Error occured");
// MessageDialog.openInformation(shell, "Info", "Info for you");
// MessageDialog.openQuestion(shell, "Question", "Really, really?");
// MessageDialog.openWarning(shell, "Warning", "I am warning you!");
// new MessageDialog(shell, "My Title", null, "My message", MessageDialog.ERROR, new String[] { "First", "Second", "Third" }, 0);