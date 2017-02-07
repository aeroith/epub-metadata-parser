var fs = require("fs");
var xml2js = require("xml2js");
var _ = require("lodash");
var mkdirp = require("mkdirp");
var yauzl = require("yauzl");
var parser = new xml2js.Parser();
var Book = {};
var bookData = {
    cover: ""
};
function epubParser(path) {
    return new Promise(function (resolve, reject) {
        bookData.path = path;
        yauzl
            .open("./test.epub", {
                lazyEntries: true
            }, function (err, zipfile) {
                if (err) 
                    throw err;
                zipfile.readEntry();
                zipfile.on("entry", function (entry) {
                    // file entry
                    zipfile.openReadStream(entry, function (err, readStream) {
                        if (err) 
                            throw err;
                        var fileName = entry
                            .fileName
                            .split("/")
                            .pop();
                        if (fileName.split(".").pop() === "jpg") {
                            if (bookData.cover === "") {
                                bookData.cover = fileName;
                                console.log(bookData.cover);
                                readStream.pipe(fs.createWriteStream("./" + fileName));
                                readStream.on("end", function () {
                                    zipfile.readEntry();
                                });
                            } else 
                                zipfile.readEntry();
                            }
                        else if (fileName.split(".").pop() === "opf") {
                            bookData.content = fileName;
                            console.log(bookData.content);
                            readStream.pipe(fs.createWriteStream("./" + fileName));
                            readStream.on("end", function () {
                                zipfile.readEntry();
                            });
                        } else 
                            zipfile.readEntry();
                        }
                    );
                });
                zipfile.once("end", function (err) {
                  if(err) console.log(err);
                    zipfile.close();
                    resolve();
                });
                zipfile.on("error",function(err){
                    if(err) console.log(err);
                    zipfile.close();
                    reject(err);
                })
            });
    });
}

function xmlParser() {
    return new Promise(function (resolve, reject) {
        console.log("******** XML Parser ********");
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
                        fs.rename("./" + bookData.cover, bookPath + "/" + cover[0]["$"].content + ".jpg", function (err) {
                            if (err) console.log(err);
                        });

                    fs.rename(bookData.path, bookPath + "/" + bookData.path.split("/").pop(), function (err) {
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
                    Book.cover = cover[0]["$"].content + ".jpg";
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