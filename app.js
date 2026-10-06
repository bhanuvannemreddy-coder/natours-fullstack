const express = require('express');
const app = express();
const AppError = require('./utils/appError');
const morgan = require('morgan');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./Routes/tourRoutes');
const userRouter = require('./Routes/userRoutes');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
//1. GLOBAL Middlewares

// set security http headers
app.use(helmet());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//rate limiter
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // this allows 100 requests from the same ip in one hour the time is in milliSeconds.
  message: 'Too many requests from this IP,please try again in an hour!',
});
app.use('/api', limiter);

//Body parser,reading data from body into req.body
app.use(
  express.json({
    limit: '10kb', // this dont accept a body larger than 10kb
  }),
);

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize()); // THIS Checks for the {} and etc things that are in the mongodb and removes them

//Data Sanitization against XSS
app.use(xss()); //if any malicious code is sent along with js ie like html with js like that

//prevent parameter pollution

app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

//serving static files
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.headers);
  next();
});

// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);
// app.get('/api/v1/tours/:id', getTour);
// app.delete('/api/v1/tours/:id', deleteTour);
// app.patch('/api/v1/tours/:id', updateTour);

//3.Routes

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
//4. START SERVER
module.exports = app;
