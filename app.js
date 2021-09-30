
const express = require("express")
const mongoose = require("mongoose")
const _ = require("lodash")

require('dotenv').config()

const app = express()

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}))
app.use(express.static(__dirname + "/public"))

// mongoose.connect("mongodb://localhost:27017/todolistDB")
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o0fbb.mongodb.net/todolistDB`)

const itemSchema = new mongoose.Schema({
    name: String
})

const Item = mongoose.model("Item", itemSchema)

const defaultItems = [
    new Item({name: "Welcome to your ToDoList!"}), 
    new Item({name: "Hit the + button to add a new item."}), 
    new Item({name: "<-- Hit this to delete an item."})
];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
})

const List = mongoose.model("List", listSchema)


app.get('/', (req, res) => {
    
    Item.find((err, items) => {
        if (items.length === 0) {
            Item.insertMany(defaultItems, err => console.log(err ? err : "Successfully entered default items into the database."))
            res.redirect('/');
        } else {
            res.render("list", {
                listTitle: "Today",
                listItems: items
            })
        }
    })
    
})

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, (err, list) => {
        if (!err) {
            switch (!list) {
            case true:
                // Create a new list
                list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();

            default:
                // Show the list

                res.render("list", {
                    listTitle: list.name,
                    listItems: list.items
                });
            }
        }
    })


})

app.post('/', (req, res) => {
    
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({name: itemName})

    if (listName === "Today") {
        item.save();
        res.redirect('/');
    } else List.findOne({name: listName}, (err, list) => {
        list.items.push(item);
        list.save();
        res.redirect(`/${listName}`)
    })
})

app.post('/delete', (req, res) => {
    const listName = req.body.list;
    const itemID = req.body.checkbox;

    if (listName === "Today") {
        Item.findByIdAndRemove(itemID, (err, item) => console.log(err ? err : `Successfully deleted item ${item}`))
        res.redirect('/');
    } else List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemID}}}, (err, list) => {
        console.log(err ? err : `Successfully updated ${list.name} list`);
        res.redirect(`/${list.name}`);
    })
})


app.get("/about", (req, res) => {
    res.render("about")
})



app.listen(port = 3000, () => console.log(`Server listening on port ${port}`))