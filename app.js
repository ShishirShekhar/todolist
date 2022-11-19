// import required modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');
const dotenv = require("dotenv");

// initialize app
const app = express();

// set config of app
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
dotenv.config()

// connect mongoose
mongoose.connect(process.env.URL);

// create a item schema
const itemsSchema = new mongoose.Schema({
    name: String,
});
// create a model for the itemSchema
const Item = mongoose.model("Item", itemsSchema);

// create a list schema
const listsSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema],
});
// create a model for the listSchema
const List = mongoose.model("List", listsSchema);

// create a few default tasks
const item1 = new Item({name: "Welcome to your todolist!!"});
const item2 = new Item({name: "Hit the + button to add a new item."});
const item3 = new Item({name: "<-- Hit this to delete an item."});

// create a default array from items
const defaultItems = [item1, item2, item3];


// create a get route.
app.get("/", function(req, res) {
    // find tasks from database.
    Item.find({}, function(err, foundItems) {
        if (err) {
            // log error and redirect to /
            console.log(err);
            res.redirect("/");
        } 
        else if (foundItems.length === 0) {
            // insert items to the database and redirect to /
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully saved default items to DB.")
                }
            });
            res.redirect("/");
        } 
        else {
            res.render("pages/list", {taskTitle: "Today", tasks: foundItems});
        }
    })
});


// create a custom route.
app.get("/:customListName", function(req, res) {
    // get customListName
    const customListName = _.capitalize(req.params.customListName);

    // find the custom list
    List.findOne({name: customListName}, function(err, foundList) {
        if (err) {
            // log error and redirect to customListName route
            console.log(err);
            res.redirect("/" + customListName);
        } 
        else {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems,
                });

                list.save();
                res.redirect("/" + customListName);
            } else {
                res.render("pages/list", {taskTitle: foundList.name, tasks: foundList.items});
            }
        }
    })
});


// post route.
app.post("/", function(req, res) {
    // get the task and list name.
    const item = req.body.newTask;
    const listName = req.body.listName;

    // create new item.
    const newItem = new Item({name: item});

    if (listName == "Today") {
        newItem.save();
        res.redirect("/");
    }
    else {
        List.findOne({name: listName}, function(err, foundList) {
            if (err) {
                console.log(err);
            }
            else {
                foundList.items.push(newItem);
                foundList.save();
                res.redirect("/" + listName);
            }
        })
    }
});


// delete route.
app.post("/delete", function(req, res) {
    // get the id of item which is checked and listName
    const id = req.body.checkbox;
    const listName = req.body.listName;

    if (listName == "Today") {
        // remove the item by id and redirect to /
        Item.findByIdAndRemove(id, function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log("item is removed successfully!!");
            }
        }) 
        res.redirect("/");
    }
    else {
        List.updateOne({name: listName}, {$pull: {items: {_id: id}}}, function(err, foundList) {
            if (err) {
                console.log(err);
            } else {
                console.log("item is removed successfully!!");
            }

            res.redirect("/" + listName);
        })
    }
})

// host the app
app.listen(process.env.PORT || 3000, function() {
    console.log("Server has started successfully");
});
