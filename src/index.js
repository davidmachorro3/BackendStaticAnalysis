const app = require('./config/server');
(require('./app/rutas/login'))(app);
(require('./app/rutas/grupos'))(app);
(require('./app/rutas/publicaciones'))(app);

app.listen(app.get("PORT"), ()=>{
	console.log("El servidor esta corriendo");
});