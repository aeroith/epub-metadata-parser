# epub-metadata-parser

## Introduction 
Use it to parse metadata and book cover(if available) from epub files, where you can use it in your applications.
Outputs a simplified JSON file. Will put the files in the folders "Books/Author Name/Book Name".
Works in similar fashion to calibredb from Calibre.

## Requirements

Depends on lodash, mkdirp, yauzl, xml2js packages. You can subtitute similar ones as well (i.e underscore for lodash).

## Usage

You can extract json file as simple as: 

```javascript

var parser = require("epub-metadata-parser");
parser("./tester.epub", function (book) {
    console.log(book);
});

```
## Bugs

There might be many bugs since it is not tested, 
I am planning to apply testing in variety of books when I have time.

