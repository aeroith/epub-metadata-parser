var parser = require('../lib/epub-metadata-parser');
parser.parse(__dirname + '/tester.epub', "../Documents", book => {
        console.log(book);
});
