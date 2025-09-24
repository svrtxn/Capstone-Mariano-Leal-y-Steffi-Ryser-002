const app = require('./app');

app.listen(app.get('port'), () => {
    console.log("Server escuchando en puerto ", app.get('port'));
});