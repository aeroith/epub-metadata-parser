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
    // a container to pass book file informations
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
      // check file extension
      if(bookData.path.split(".").pop() !== "epub")
        return reject(new Error("File extension is not valid"));
      // create temporary directory
      mkdirp("./" + bookData.tmp, function (err) {
        if (err) 
         return reject(err);
        // unzip
        yauzl
          .open(path, {
            lazyEntries: true
          }, function (err, zipfile) {
            if (err) 
              return reject(err);
            zipfile.readEntry();
            zipfile.on("entry", function (entry) {
              // at file entry
              zipfile
                .openReadStream(entry, function (err, readStream) {
                  if (err) 
                    return reject(err);
                  var fileName = entry
                    .fileName
                    .split("/")
                    .pop();
                  // check if fileName is valid
                  if (fileName === '') 
                    zipfile.readEntry();
                  else if (fileName.split(".").pop() === "opf") {
                    bookData.content = fileName;
                    readStream.pipe(fs.createWriteStream("./" + bookData.tmp + fileName));
                    readStream.on("end", function () {
                      fs
                        .readFile("./" + bookData.tmp + fileName, function (err, data) {
                          parser
                            .parseString(data, function (err, result) {
                              try {
                                var metadata = result.package.metadata[0].meta;
                              } catch (err) {
                                return reject(err);
                              }
                              if (typeof metadata !== "undefined") 
                                for (var i = 0; i < metadata.length; i++) {
                                  if (metadata[i]["$"].name === "cover") {
                                    bookData.cover = metadata[i]["$"].content;
                                  }
                                }
                              if (bookData.cover === '') {
                                bookData.cover = "notfound";
                              }
                              zipfile.readEntry();
                            })
                        });
                    });
                  } else 
                    zipfile.readEntry();
                  }
                );
            });
            zipfile.once("end", function (err) {
              if (err) 
                return reject(err);
              zipfile.close();
              yauzl.open(path, {
                lazyEntries: true
              }, function (err, zipfile) {
                if (err) 
                  return reject(err);
                zipfile.readEntry();
                zipfile.on("entry", function (entry) {
                  // at file entry
                  zipfile
                    .openReadStream(entry, function (err, readStream) {
                      if (err) 
                        return reject(err);
                      var fileName = entry
                        .fileName
                        .split("/")
                        .pop();
                      // check if fileName is valid
                      if (fileName === '') 
                        zipfile.readEntry(); // if valid continue
                      else if (bookData.cover === 'notfound') {
                        if (fileName.split(".").pop() === "jpg" || fileName.split(".").pop() === "jpeg") {
                          bookData.cover = fileName;
                          readStream.pipe(fs.createWriteStream("./" + bookData.tmp + fileName));
                          readStream.on("end", function () {
                            zipfile.readEntry();
                          });
                        } else 
                          zipfile.readEntry();
                        }
                      else if (fileName === bookData.cover) {
                        readStream.pipe(fs.createWriteStream("./" + bookData.tmp + fileName));
                        readStream.on("end", function () {
                          zipfile.readEntry();
                        });
                      } else if (fileName === (bookData.cover + ".jpg") || fileName === (bookData.cover + ".jpeg") || fileName === (bookData.cover + ".png")) {
                        bookData.cover = fileName;
                        readStream.pipe(fs.createWriteStream("./" + bookData.tmp + fileName));
                        readStream.on("end", function () {
                          zipfile.readEntry();
                        } // An educated guess nonetheless
                        )
                      } else if ((fileName.split(".").pop() === "png" || fileName.split(".").pop() === "jpg" || fileName.split(".").pop() === "jpeg") && (fileName.split(".")[0] === "cover" || fileName.split(".")[0] === "kapak")) {
                        bookData.cover = fileName;
                        readStream.pipe(fs.createWriteStream("./" + bookData.tmp + fileName));
                        readStream.on("end", function () {
                          zipfile.readEntry();
                        })
                      } else 
                        zipfile.readEntry();
                      }
                    );
                });
                zipfile.once("end", function (err) {
                  if (err) 
                    return reject(err);
                  zipfile.close();
                  resolve(bookData);
                });
                zipfile.on("error", function (err) {
                  if (err) 
                    return reject(err);
                  zipfile.close();
                  return reject(err);
                })
              });
            });
            zipfile.on("error", function (err) {
              if (err) 
                return reject(err);
              zipfile.close();
              return reject(err);
            })
          });
      });
    });
  }

  // a helper function to convert an array to json object
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
            return reject(err);
          parser
            .parseString(data, function (err, result) {
              try {
                var jsondata = JSON.parse(JSON.stringify(result));
                var book = convArr(jsondata.package.metadata);
                var cover = _.filter(book.meta, (i) => i["$"].name === "cover");
                var rating = _.filter(book.meta, (i) => i["$"].name === "calibre:rating");
                var bookPath = bookData.outDir + "/Books/" + book["dc:creator"][0]._ + "/" + book["dc:title"][0];
              } catch (err) {
                return reject(err)
              }
              try {
                mkdirp(bookPath, function (err) {
                  if (err) 
                    return reject(err);
                  if (cover !== "undefined" && cover.length > 0) 
                    fs.rename("./" + bookData.tmp + bookData.cover, bookPath + "/" + cover[0]["$"].content, function (err) {
                      if (err) 
                        return reject(err);
                      fs
                        .rename(bookData.path, bookPath + "/" + bookData.epubName, function (err) {
                          if (err) 
                            return reject(err);
                          fs
                            .rename("./" + bookData.tmp + bookData.content, bookPath + "/" + bookData.content, function (err) {
                              if (err) 
                                return reject(err);
                              fs
                                .rmdir("./" + bookData.tmp, function (err) {
                                  if (err) 
                                    return reject(err);
                                  }
                                );
                            });
                        });
                    });
                  else if (bookData.cover !== "" && bookData.cover !== "notfound") 
                    fs.rename("./" + bookData.tmp + bookData.cover, bookPath + "/" + bookData.cover, function (err) {
                      if (err) 
                        return reject(err);
                      fs
                        .rename(bookData.path, bookPath + "/" + bookData.epubName, function (err) {
                          if (err) 
                            return reject(err);
                          fs
                            .rename("./" + bookData.tmp + bookData.content, bookPath + "/" + bookData.content, function (err) {
                              if (err) 
                                return reject(err);
                              fs
                                .rmdir("./" + bookData.tmp, function (err) {
                                  if (err) 
                                    return reject(err);
                                  }
                                );
                            });
                        });
                    });
                  else 
                    fs
                      .rename(bookData.path, bookPath + "/" + bookData.epubName, function (err) {
                        if (err) 
                          return reject(err);
                        fs
                          .rename("./" + bookData.tmp + bookData.content, bookPath + "/" + bookData.content, function (err) {
                            if (err) 
                              return reject(err);
                            fs
                              .rmdir("./" + bookData.tmp, function (err) {
                                if (err) 
                                  return reject(err);
                                }
                              );
                          });
                      });
                  }
                );
              } catch (err) {
                return reject(err);
              }
              // get book data according to epub specifications
              try {
                if (book["dc:creator"] !== "undefined") 
                  Book.author = book["dc:creator"][0]._;
                if (book["dc:title"] !== "undefined") 
                  Book.title = book["dc:title"][0];
                if (typeof book["dc:description"] !== "undefined") 
                  Book.description = book["dc:description"][0];
                if (typeof cover !== "undefined" && typeof cover[0] !== "undefined") 
                  Book.cover = cover[0]["$"].content;
                if (typeof cover[0] === "undefined" && bookData.cover !== "notfound" && bookData.cover !== "") 
                  Book.cover = bookData.cover;
                if (typeof book["dc:subject"] !== "undefined") 
                  Book.subject = book["dc:subject"];
                if (typeof book["dc:language"] !== "undefined" && typeof book["dc:language"][0] !== "undefined") 
                  Book.language = typeof book["dc:language"][0] === "object"
                    ? book["dc:language"][0]._
                    : book["dc:language"][0];
                if (typeof book["dc:publisher"] !== "undefined") 
                  Book.publisher = book["dc:publisher"][0];
                if (typeof book["dc:date"] !== "undefined") 
                  Book.pubdate = typeof book["dc:date"][0] === "object"
                    ? book["dc:date"][0]._
                    : book["dc:date"][0];
                if (typeof rating !== "undefined" && typeof rating[0] !== "undefined") 
                  Book.rating = rating[0]["$"].content;
                Book.fileName = bookData.epubName;
                resolve(Book);
              } catch (err) {
                return reject(err);
              }
            });
        });
    });
  }
  function parse(path, outDir, callback) {
    open(path, outDir)
      .then(xmlParser)
      .catch(err => {
        // necessary cleanup
        fs.rmdir(path.replace(/\.[^/.]+$/, ""), e => {
          if(e)
            console.log(e);
          console.log("in file " + path.replace(/^.*[\\\/]/, '') + " " + err);
        });
      })
      .then(callback);
  }
  return {parse: parse};

})();

module.exports = epubParser;