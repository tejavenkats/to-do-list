const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
});

const itemSchema = new mongoose.Schema({
  item: String,
});

const Item = new mongoose.model("Item", itemSchema);

const item1 = new Item({
  item: "Learn full Stack",
});

const item2 = new Item({
  item: "Implement full Stack",
});

const item3 = new Item({
  item: "Master full Stack",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const List = new mongoose.model("List", listSchema);

// let item = ["buy food", "cook food", "eat food"];
app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Default Insertion Succesfull");
        }
      });
      res.redirect("/");
    }
    res.render("list", { kindOfDay: "Today", addItem: foundItems });
  });
});

app.get("/favicon.ico", (req, res) => res.status(204));

app.get("/:newList", function (req, res) {
  const newList = _.capitalize(req.params.newList);

  List.findOne({ name: newList }, function (err, listPresent) {
    if (err) {
      console.log(err);
    } else {
      if (!listPresent) {
        const list = new List({
          name: newList,
          items: defaultItems,
        });

        list.save();
        res.redirect("/" + newList);
      } else {
        res.render("list", {
          kindOfDay: listPresent.name,
          addItem: listPresent.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const newCustomListTitle = req.body.listName;
  const newItemObject = new Item({
    item: itemName,
  });

  if (newCustomListTitle === "Today") {
    newItemObject.save();
    res.redirect("/");
  } else {
    List.findOne({ name: newCustomListTitle }, function (err, listPresent) {
      listPresent.items.push(newItemObject);
      listPresent.save();
      res.redirect("/" + newCustomListTitle);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listNameHidden;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItem, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("removed Checked off item");
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItem } } },
      function (err, listPresent) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.listen(3000, function () {
  console.log("Server UP and running on localhost:3000!!");
});
