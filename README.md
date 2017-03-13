# epub-metadata-parser

## Introduction 
Use it to parse metadata and extract book cover(if available) from epub files so that you can use it in your applications.
Outputs a simplified JSON file. Will put the files in the folders given by the user appended by
 "/Books/Author Name/Book Name". Works in similar fashion to calibredb from Calibre. Only epub files are
 supported and the files must comply with IDPF Open Packaging Format Specification.

## Requirements

Depends on lodash, mkdirp, yauzl, xml2js packages. You can subtitute similar ones as well (i.e underscore for lodash).

## Usage

You can extract json file as simple as given in the example below. Note that the first argument is the input file
and the second argument is the output directory.

```javascript

var epubParser = require('epub-metadata-parser');
epubParser.parse('./tester.epub', '../Documents' , book => {
    console.log(book);
});

```
The outputted JSON file has these properties (cover is undefined if not found):

```javascript
{ author: 'Lewis Carroll',
  title: 'Alice\'s Adventures in Wonderland',
  description: "Alice\'s Adventures in Wonderland (1865) is a novel written by English author Charles Lutwidge Dodgson, better known under the pseudonym Lewis Carroll. It tells the story of a girl named Alice who falls down a rabbit-hole into a fantasy world populated by peculiar and anthropomorphic creatures.\r\nThe tale is filled with allusions to Dodgson\'s friends (and enemies), and to the lessons that British schoolchildren were expected to memorize. The tale plays with logic in ways that have made the story of lasting popularity with adults as well as children. It is considered to be one of the most characteristic examples of the genre of literary nonsense, and its narrative course and structure has been enormously influential, mainly in the fantasy genre.",
  cover: 'book-cover',
  subject: [ 'Fiction', 'Fantasy', 'Juvenile' ],
  language: 'en',
  publisher: 'Feedbooks',
  pubdate: '1897',
  fileName: 'tester.epub' }
```

## Bugs
After testing the parser with over 2000 books, it seems now 
stable and handles errors correctly however, any bug reports are most welcomed. 

