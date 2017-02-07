var parser = require("../lib/epub-metadata-parser");
parser.parse(__dirname + "/tester.epub", "../Documents", function (book) {
    console.log(book);
});
