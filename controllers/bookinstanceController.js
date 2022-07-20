var BookInstance = require('../models/bookinstance');
const { body, validationResult } = require('express-validator');
var Book = require('../models/book');
var async = require("async");

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
  BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
      if (err) { return next(err); }
      // Successful, so render
      res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
    });
};

exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec(function (err, bookinstance) {
      if (err) return next(err);
      if (bookinstance == null) {
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }

      res.render("bookinstance_detail", {
        title: `Copy: ${bookinstance.book.title}`,
        bookinstance: bookinstance,
      });
    });
};

exports.bookinstance_create_get = (req, res, next) => {
  Book.find({}, "title").exec(function (err, books) {
    if (err) return next(err);

    res.render("bookinstance_form", {
      title: "Create BookInstance",
      book_list: books,
      selected_book: undefined,
      errors: undefined,
      bookinstance: undefined,
    });
  });
};

exports.bookinstance_create_post = [
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid Date")
    .optional({
      checkFalsy: true,
    })
    .isISO8601()
    .toDate(),

  (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      Book.find({}, "title").exec(function (err, books) {
        if (err) return next(err);

        res.render("bookinstance_form", {
          title: "Create BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance: bookinstance,
        });
        return;
      });
    } else {
      bookinstance.save(function (err) {
        if (err) return next(err);

        res.redirect(bookinstance.url);
      });
    }
  },
];

exports.bookinstance_delete_get = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec(function (err, bookinstance) {
      if (err) return next(err);
      if (bookinstance == null) {
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }

      res.render("bookinstance_delete", {
        title: `Copy: ${bookinstance.book.title}`,
        bookinstance: bookinstance,
      });
    });
};

exports.bookinstance_delete_post = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec(function (err, bookinstance) {
      if (err) return next(err);
      BookInstance.findByIdAndRemove(req.body.bookinstanceid, (err) => {
        if (err) return next(err);
        res.redirect("/catalog/bookinstances");
      });
    });
};

exports.bookinstance_update_get = (req, res, next) => {
  async.parallel(
    {
      books: function (callback) {
        Book.find({}, "title").exec(callback);
      },
      book_instance: function (callback) {
        BookInstance.findById(req.params.id).populate("book").exec(callback);
      },
    },
    function (err, results) {
      if (err) return next(err);
      if (results.book_instance == null) {
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }

      res.render("bookinstance_form", {
        title: "Updated BookInstance",
        book_list: results.books,
        selected_book: results.book_instance.book,
        errors: undefined,
        bookinstance: results.book_instance,
      });
    }
  );
};

exports.bookinstance_update_post = [
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid Date")
    .optional({
      checkFalsy: true,
    })
    .isISO8601()
    .toDate(),

  (req, res, next) => {
    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      Book.find({}, "title").exec(function (err, books) {
        if (err) return next(err);

        res.render("bookinstance_form", {
          title: "Update BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance: bookinstance,
        });
        return;
      });
    } else {
      BookInstance.findByIdAndUpdate(
        req.params.id,
        bookinstance,
        {},
        function (err) {
          if (err) return next(err);

          res.redirect(bookinstance.url);
        }
      );
    }
  },
];