# Angular/Express Skel

Initially based on [Angular Express Seed](https://github.com/btford/angular-express-seed).

Start an awesome app with AngularJS on the front, Express + Node on the back. This project is an
application skeleton for a typical [AngularJS](http://angularjs.org/) web app for those who want
to use Node to serve their app.

## How to use it

Clone the angular-express-seed repository, run `npm install && bower install` to grab the dependencies, and start hacking!

### Running the app

Runs like a typical express app:

    node app.js


### Grunt

    grunt
    grunt linters
    grunt dev

## Directory Layout
    
    app.js              --> app config
    package.json        --> for npm
    frontend/           --> all of the files to be used in on the client side
      css/              --> css files
        app.css         --> default stylesheet
      js/               --> javascript files
        app.js          --> declare top-level app module
        controllers.js  --> application controllers
        directives.js   --> custom angular directives
        filters.js      --> custom angular filters
        services.js     --> custom angular services
      views/
        index.jade        --> main page for app
        footer.jade       --> footer for app
        layout.jade       --> doctype, title, head boilerplate
          partials/         --> angular view partials (partial jade templates)
           partial1.jade
           partial2.jade
    backend/
      api.js            --> route for serving JSON
      index.js          --> route for serving HTML pages and partials

## License
MIT
