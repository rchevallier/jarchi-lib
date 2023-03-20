# lib/misc.js

This is a common utilities library

Currently it exposes:
* an improved logging mechanism on top of console.log, See `log` and `LogLevel` objects.
    * `log.level`: set/get the current LogLevel
    * `log.trace`, `log.debug`, `log.info`, `log.warn`, `log.error`, `log.critical`: message logging for each level
    * `log.message`: generic message logging
* a simple `assert()` function
* a `read()` function to read the content of a file
* a `mkdirs()` function to create a directory structure
* the JFace `MessageDialog` type
* the `JFile` = `java.io.File` type
* the `JUrl` = `java.net.URL` type
* the `JPath` = `java.nio.file.Path` type
