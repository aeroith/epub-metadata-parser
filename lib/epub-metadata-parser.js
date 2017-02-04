var fs = require("fs");
var unzip = require("unzip");
var xml2js = require("xml2js");
var _ = require("lodash");
var mkdirp = require("mkdirp");

var parser = new xml2js.Parser();
var Book = {};
var bookData = {
    cover: ""
};

function epubParser(path) {
    return new Promise(function (resolve, reject) {
        bookData.path = path;
        bookData.epub = path.split("/").pop();
        fs.createReadStream(path)
            .pipe(unzip.Parse())
            .on("entry", function (entry) {
                var fileName = entry.path;
                // get the cover image (first image usually)
                if (fileName.split(".").pop() === "jpg") {
                    var cover = fileName.replace(/^.*[\\\/]/, "");
                    if (bookData.cover === "") {
                        bookData.cover = cover;
                        entry.pipe(fs.createWriteStream(cover));
                    }
                }
                // get the xml file as well
                else if (fileName.split(".").pop() === "opf") {
                    var content = fileName.replace(/^.*[\\\/]/, "");
                    bookData.content = content;
                    entry.pipe(fs.createWriteStream(content));
                } else {
                    entry.autodrain();
                }
            }).on("error", reject).on("close", resolve);
    });
}

function xmlParser() {
    return new Promise(function (resolve, reject) {
        fs.readFile("./" + bookData.content, function (err, data) {
            if (err) reject(err);
            parser.parseString(data, function (err, result) {
                var jsondata = JSON.parse(JSON.stringify(result));
                var book = convArr(jsondata.package.metadata);
                var cover = _.filter(book.meta, (i) => i["$"].name === "cover");
                var rating = _.filter(book.meta, (i) => i["$"].name === "calibre:rating");
                var bookPath = "./Books/" + book["dc:creator"][0]._ + "/" + book["dc:title"][0];
                mkdirp(bookPath, function (err) {
                    if (err) console.log(err);
                    if (cover !== "undefined" && cover.length > 0)
                        fs.rename("./" + bookData.cover, bookPath + "/" + cover[0]["$"].content, function (err) {
                            if (err) console.log(err);
                        });

                    fs.rename(bookData.path, bookPath + "/" + bookData.epub, function (err) {
                        if (err) console.log(err);
                    });
                    fs.rename("./" + bookData.content, bookPath + "/" + bookData.content, function (err) {
                        if (err) console.log(err);
                    });

                });
                Book.author = book["dc:creator"][0]._;
                Book.title = book["dc:title"][0];
                if (typeof book["dc:description"] !== "undefined")
                    Book.description = book["dc:description"][0];
                if (typeof cover[0] !== "undefined")
                    Book.cover = cover[0]["$"].content;
                Book.subject = book["dc:subject"];
                if (typeof book["dc:language"][0] !== "undefined")
                    Book.language = typeof book["dc:language"][0] === "object" ? book["dc:language"][0]._ : book["dc:language"][0];
                if (typeof book["dc:publisher"] !== "undefined")
                    Book.publisher = book["dc:publisher"][0];
                if (typeof book["dc:date"] !== "undefined")
                    Book.pubdate = typeof book["dc:date"][0] === "object" ? book["dc:date"][0]._ : book["dc:date"][0];
                if (typeof rating[0] !== "undefined")
                    Book.rating = rating[0]["$"].content;
                resolve();
            });
        });
    });
}

var convArr = function (arr) {
    var jsonData = {};
    _.forEach(arr, function (elem) {
        var keys = Object.keys(elem);
        _.forEach(keys, function (key) {
            var value = elem[key];
            jsonData[key] = value;
        });
    })
    return jsonData;
};

module.exports = function (path, callback) {
    epubParser(path).then(xmlParser).then(function () {
        return Book;
    }).then(callback);
};