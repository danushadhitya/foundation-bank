var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var async = require('async');
app.use(express.static('.'));
app.use(bodyParser.urlencoded({extended: true}));
const MongoClient = require('mongodb').MongoClient;


const url = "mongodb+srv://danushadhitya:danush.1894@cluster0.vynni.mongodb.net/db?retryWrites=true&w=majority";

const client = new MongoClient(url,{useNewUrlParser: true, useUnifiedTopology: true});

client.connect().then(res => {
  app.listen(8000,function(){
    console.log("Server Started");
  });
}).catch(err => {
  console.log(error);
})


app.get("/",function( req,res){
  res.render("Home.ejs");
});

app.get("/customers",async function( req,res){
  let data = await client.db('mydb').collection("customers").find().toArray()
  res.render("customers.ejs",{data:data});
});
app.post("/customers",async function(req,res){
  var names=req.body.name;
  let data = await client.db('mydb').collection('customers').find({}).toArray()
  res.render("transaction.ejs",{names:names,data:data});
})
app.post("/transactions",async function(req,res){
  let sender    =req.body.sender;
  let recipient =req.body.recipient;
  let amount    =parseInt(req.body.amount);

  let senderBalance = await client.db('mydb').collection('customers').findOne({name: sender})
  if(senderBalance === null) {
    res.send("Sender User Not Found")
    return
  }
  senderBalance = senderBalance.balance
  
  if(senderBalance < amount) {res.send("Low Balance")}
  else {
    let recipientBalance = await client.db('mydb').collection('customers').findOne({name: recipient})
    if(recipientBalance === null) {
      res.send("receipient User Not Found")
      return
    }
    
    recipientBalance = recipientBalance.balance
    
    senderBalance = senderBalance - amount
    recipientBalance = recipientBalance + amount
    let senderPromise = client.db('mydb').collection('customers').updateOne({name: sender}, {$set: {balance: senderBalance}})
    let recipientPromise = client.db('mydb').collection('customers').updateOne({name: recipient}, {$set: {balance: recipientBalance}})
    let transactionPromise = client.db('mydb').collection('transactions').insertOne({Sender:sender,Recipient:recipient,Amount:amount})
    await Promise.all([senderPromise, recipientPromise, transactionPromise])

    res.redirect('/customers')
  }
})
app.get("/database",async function( req,res){
  let data = await client.db('mydb').collection("transactions").find().toArray()
  res.render("table.ejs",{data:data});
});
