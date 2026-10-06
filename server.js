const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION!');
  console.log(err.name, err.message);
});

const mongoose = require('mongoose');

const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE;
const local_db = process.env.DATABASE_LOCAL;
mongoose
  .connect(DB, {
    //.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => {
    console.log('DB connection successful');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`app running on port ${port}`);
});
//this is a kind of starting point;

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION!  Shutting down...');
  server.close(() => {
    process.exit(1);
  });
}); //this is like a event that caughts on unhandledRejection
