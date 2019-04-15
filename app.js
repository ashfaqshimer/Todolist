//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

//The main app starts here

mongoose.connect(
    'mongodb+srv://admin-ashfaq:admin123@cluster0-nkvw7.mongodb.net/toDoListDB',
    {
        useNewUrlParser: true
    }
);

const itemsSchema = {
    name: String
};

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const Item = mongoose.model('Item', itemsSchema);
const List = mongoose.model('List', listSchema);

const item1 = new Item({
    name: 'Welcome to your todolist!'
});

const item2 = new Item({
    name: 'Press the + button to add a new entry'
});
const item3 = new Item({
    name: 'Press the checkbox to delete an entry'
});

const defaultItems = [item1, item2, item3];

app.get('/', function(req, res) {
    Item.find({}, (err, foundItems) => {
        if (foundItems.length === 0) {
            if (err) {
                console.log(err);
            } else {
                Item.insertMany(defaultItems, err => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Successfully updated default items');
                    }
                });
                res.redirect('/');
            }
        } else {
            res.render('list', {
                listTitle: 'Today',
                newListItems: foundItems
            });
        }
    });
});

app.get('/:slug', (req, res) => {
    const customListName = _.capitalize(req.params.slug);

    List.findOne({ name: customListName }, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            if (result) {
                //show an existing list
                res.render('list', {
                    listTitle: result.name,
                    newListItems: result.items
                });
            } else {
                //create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect('/' + customListName);
            }
        }
    });
});

app.post('/', function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    if (listName === 'Today') {
        item.save();
        res.redirect('/');
    } else {
        List.findOne({ name: listName }, (err, result) => {
            result.items.push(item);
            result.save();
            res.redirect('/' + listName);
        });
    }
});

app.post('/delete', (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === 'Today') {
        Item.findOneAndDelete({_id:checkedItemId}, err => {
            if (err) {
                console.log(err);
            } else {
                console.log('Successfully deleted');
                res.redirect('/');
            }
        });
    } else {
        List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: checkedItemId } } },
            (err, result) => {
                if (!err) {
                    res.redirect('/' + listName);
                }
            }
        );
    }
});

app.get('/work', function(req, res) {
    res.render('list', { listTitle: 'Work List', newListItems: workItems });
});

app.get('/about', function(req, res) {
    res.render('about');
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

app.listen(port, () => {
    console.log('Server has started');
});
