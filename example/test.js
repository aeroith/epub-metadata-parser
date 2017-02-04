var parser = require("../lib/epub-metadata-parser");
parser("./tester.epub", function (book) {
    console.log(book);
});