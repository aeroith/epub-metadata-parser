var parser = require("./epub-metadata-parser");
parser("./tester.epub", function (book) {
    console.log(book);
});