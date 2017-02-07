var parser = require("../lib/epub-metadata-parser");
parser.parse(__dirname + "/tester.epub", function (book) {
    console.log(book);
});
