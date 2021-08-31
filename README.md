# adp-download

Attempts to download all paystubs from ADP's PayRoll WorkCenter

```shell
$ npm install
$ ./adp.js PRWC_Username PRWC_Password
```

Paystubs will be downloded to the `paystubs` directory.

## Known Issues

* Must use Chromium w/o headless to properly download
* If you go back far enough, eventually you'll get a page with no paystub and a message about Xceed not being licensed.  At that point, click the Log Off link in the primary tab and just ^C the process, you are unlikely to get anymore data.