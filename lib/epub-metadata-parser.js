var epubParser;

epubParser = (function () {
  var fs = require("fs");
  var xml2js = require("xml2js");
  var _ = require("lodash");
  var mkdirp = require("mkdirp");
  var yauzl = require("yauzl");
  var PATH = require('path');
  var parser = new xml2js.Parser();

  function open(path, outDir) {
    // defaults to current d,rectory
    outDir = outDir || "."
    // a container to pass book file locations
    var bookData = {
      cover: "",
      path: path,
      epubName: path
        .split("/")
        .pop(),
      tmp: PATH.basename(path, ".epub") + "/",
      outDir: outDir
    }
    return new Promise(function (resolve, reject) {
      mkdirp("./" + bookData.tmp, function (err) {
        if (err) 
          reject(err);
       // Unzip the content and cover 
        yauzl
          .open(path, {
            lazyEntries: true
          }, function (err, zipfile) {
            if (err) 
              throw err;
            zipfile.readEntry();
            zipfile.on("entry", function (entry) {
              // at file entry
              zipfile
                .openReadStream(entry, function (err, readStream) {
                  if (err) 
                    reject(err);
                  var fileName = entry
                    .fileName
                    .split("/")
                    .pop();
                  if (fileName.split(".").pop() === "jpg" || fileName.split(".").pop() === "jpeg" || fileName.split(".").pop() === "png") {
                    if (bookData.cover === "") {
                      bookData.cover = fileName;
                      readStream.pipe(fs.createWriteStream("./" + bookData.tmp + fileName));
                      readStream.on("end", function () {
                        zipfile.readEntry();
                      });
                    } else 
                      zipfile.readEntry();
                    }
                  else if (fileName.split(".").pop() === "opf") {
                    bookData.content = fileName;
                    readStream.pipe(fs.createWriteStream("./" + bookData.tmp + fileName));
                    readStream.on("end", function () {
                      zipfile.readEntry();
                    });
                  } else 
                    zipfile.readEntry();
                  }
                );
            });
            zipfile.once("end", function (err) {
              if (err) 
                console.log(err);
              zipfile.close();
              resolve(bookData);
            });
            zipfile.on("error", function (err) {
              if (err) 
                console.log(err);
              zipfile.close();
              reject(err);
            })
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

  function xmlParser(bookData) {
    var Book = {};
    return new Promise(function (resolve, reject) {
      fs
        .readFile("./" + bookData.tmp + bookData.content, function (err, data) {
          if (err) 
            reject(err);
          parser
            .parseString(data, function (err, result) {
              var jsondata = JSON.parse(JSON.stringify(result));
              var book = convArr(jsondata.package.metadata);
              var cover = _.filter(book.meta, (i) => i["$"].name === "cover");
              var rating = _.filter(book.meta, (i) => i["$"].name === "calibre:rating");
              var bookPath = bookData.outDir + "/Books/" + book["dc:creator"][0]._ + "/" + book["dc:title"][0];
              mkdirp(bookPath, function (err) {
                if (err) 
                  reject(err);
                if (cover !== "undefined" && cover.length > 0) 
                  fs.rename("./" + bookData.tmp + bookData.cover, bookPath + "/" + cover[0]["$"].content, function (err) {
                    if (err) 
                      reject(err);
                    fs
                      .rename(bookData.path, bookPath + "/" + bookData.epubName, function (err) {
                        if (err) 
                          reject(err);
                        fs
                          .rename("./" + bookData.tmp + bookData.content, bookPath + "/" + bookData.content, function (err) {
                            if (err) 
                              reject(err);
                            fs
                              .rmdir("./" + bookData.tmp, function (err) {
                                if (err) 
                                  reject(err);
                                }
                              );
                          });
                      });
                  });
                }
              );
              Book.author = book["dc:creator"][0]._;
              Book.title = book["dc:title"][0];
              if (typeof book["dc:description"] !== "undefined") 
                Book.description = book["dc:description"][0];
              if (typeof cover[0] !== "undefined") 
                Book.cover = cover[0]["$"].content;
              Book.subject = book["dc:subject"];
              if (typeof book["dc:language"][0] !== "undefined") 
                Book.language = typeof book["dc:language"][0] === "object"
                  ? book["dc:language"][0]._
                  : book["dc:language"][0];
              if (typeof book["dc:publisher"] !== "undefined") 
                Book.publisher = book["dc:publisher"][0];
              if (typeof book["dc:date"] !== "undefined") 
                Book.pubdate = typeof book["dc:date"][0] === "object"
                  ? book["dc:date"][0]._
                  : book["dc:date"][0];
              if (typeof rating[0] !== "undefined") 
                Book.rating = rating[0]["$"].content;
              resolve(Book);
            });
        });
    });
  }
  function parse(path, outDir, callback) {
    open(path, outDir)
      .then(xmlParser)
      .then(callback);
  }
  return {parse: parse};

})();

module.exports = epubParser;