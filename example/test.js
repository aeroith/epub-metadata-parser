var parser = require("../lib/epub-metadata-parser");
parser(__dirname + "/tester.epub", function (book) {
    console.log(book);
});