const parser = require('../lib/epub-metadata-parser');
const chai = require('chai');
const rimraf = require('rimraf');
const fs = require('fs');
const assert = chai.assert;
const expect = chai.expect;
const epubPath = __dirname + '/tester.epub';

describe('Epub Parser', () => {

  before(() => {
    fs.writeFileSync(epubPath, fs.readFileSync(__dirname + '/../example/tester.epub'));
  });

  after(() => rimraf(__dirname + '/../tester', () => {
    fs.unlinkSync(__dirname + '/tester.epub');
  }));

  it('should parse the epub file', () => {
    parser.parse(epubPath, __dirname, book => {
      expect(book).to.have.property('author');
      expect(book.author).to.not.equal(null);
      expect(book).to.have.property('title');
      expect(book.title).to.not.equal(null);
      expect(book).to.have.property('description');
      expect(book.description).to.not.equal(null);
      expect(book).to.have.property('subject');
      expect(book.subject).to.not.equal(null);
      expect(book).to.have.property('language');
      expect(book.language).to.not.equal(null);
      expect(book).to.have.property('publisher');
      expect(book.publisher).to.not.equal(null);
      expect(book).to.have.property('pubdate');
      expect(book.pubdate).to.not.equal(null);
      expect(book).to.have.property('fileName');
      expect(book.fileName).to.not.equal(null);
      done();
    });
  });
});
