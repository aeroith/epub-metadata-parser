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
                  // check if fileName is valid
                  if(fileName === '')
                    zipfile.readEntry();
                  // if valid continue
                  else if(bookData.cover === 'notfound'){
                    if(fileName.split(".").pop() === "jpg" || fileName.split(".").pop() === "jpeg"){
                      bookData.cover = fileName;
                      readStream.pipe(fs.createWriteStream("./" + bookData.tmp + fileName));
                      readStream.on("end", function () {
                        zipfile.readEntry();
                      });
                    }
                  }
                  else if (fileName === bookData.cover){
                      readStream.pipe(fs.createWriteStream("./" + bookData.tmp + fileName));
                      readStream.on("end", function () {
                        zipfile.readEntry();
                      });
                    }
                  else if (fileName === (bookData.cover + ".jpg") ||
                  fileName === (bookData.cover + ".jpeg") || fileName === (bookData.cover + ".png")) {
                      bookData.cover = fileName;
                      readStream.pipe(fs.createWriteStream("./" + bookData.tmp + fileName));
                      readStream.on("end", function () {
                        zipfile.readEntry();
                      });
                    }
                  // get the xml parse and try to find cover image if exists
                  // it is assumed that xml file is on the top directory level
                  else if (fileName.split(".").pop() === "opf") {
                    bookData.content = fileName;
                    readStream.pipe(fs.createWriteStream("./" + bookData.tmp + fileName));
                    readStream.on("end", function () {
                    fs.readFile("./" + bookData.tmp + fileName, function(err, data) {
                    parser.parseString(data, function (err, result) {
                        try {
                          var metadata = result.package.metadata[0].meta;
                        }
                        catch(err) {
                          reject(err);
                        }
                        if(typeof metadata !== "undefined")
                        for(var i = 0; i< metadata.length; i++){
                            if(metadata[i]["$"].name === "cover"){
                              bookData.cover = metadata[i]["$"].content;
                            }
                        }
                        if(bookData.cover===''){
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
                  else if (bookData.cover !== "" && bookData.cover !== "notfound") 
                  fs.rename("./" + bookData.tmp + bookData.cover, bookPath + "/" + bookData.cover, function (err) {
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
                  else
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
                }
              );
              Book.author = book["dc:creator"][0]._;
              Book.title = book["dc:title"][0];
              if (typeof book["dc:description"] !== "undefined") 
                Book.description = book["dc:description"][0];
              if (typeof cover[0] !== "undefined") 
                Book.cover = cover[0]["$"].content;
              if (typeof cover [0] === "undefined" && bookData.cover !== "notfound" && bookData.cover !== "")
                Book.cover = bookData.cover;
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
      .catch(err => console.log(err))
      .then(callback);
  }
  return {parse: parse};

})();

module.exports = epubParser;