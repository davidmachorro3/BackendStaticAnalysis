const pool = require('../../config/db');

module.exports = (app) =>{
	app.get('/login/:username',(req,res)=>{
		consulta = `SELECT * FROM Usuario WHERE username='${req.params.username}'`;
		pool.query(consulta,(err,result)=>{
			if(err) res.json({status : 0, message : "No fue posible consultar"});
			else res.json({status : 1, message : "Consulta exitosa", resultado : result.rows});
		});
	});

	app.post('/register',(req,res)=>{
		consulta = `INSERT INTO Usuario (username,nombre,passwrd) VALUES ('${req.body.username}','${req.body.nombre}','${req.body.passwrd}');`;
		pool.query(consulta,(err,result)=>{
			if(err) {
				res.json({status : 0, message : "No fue posible registrar al usuario"});
			} else {
				res.json({status : 1, message : "Usuario registrado exitosamente"});
			}
		});
	});

	app.put('/cambiarnombre',(req,res)=>{
		consulta = `UPDATE Usuario SET nombre = '${req.body.nombre}' WHERE username = '${req.body.username}'`;
		pool.query(consulta,(err,result)=>{
			if(err) {
				res.json({status : 0, message : "No fue posible actualizar el nombre"});
			} else {
				res.json({status : 1, message : "Nombre actualizado con exito"});
			}
		});
	});

	app.put('/cambiarcontra',(req,res)=>{
		consulta = `UPDATE Usuario SET passwrd = '${req.body.passwrd}' WHERE username = '${req.body.username}'`;
		pool.query(consulta, (err,result)=>{
			if(err) {
				res.json({status : 0, message : "No fue posible actualizar la contraseña"});
			} else {
				res.json({status : 1, message : "Contraseña actualizada con exito"});
			}
		});
	});

	app.get('/verpublicacionesusuario/:username',(req,res)=>{
		consulta = `SELECT * FROM Publicacion, Grupo WHERE codigogrupo = codigo AND codigogrupo IN (SELECT codigo FROM GruposMiembros WHERE username = '${req.params.username}') ORDER BY fecha DESC`;
        arregloRetorno = [];
        pool.query(consulta,(err,result)=>{
            if(err) {
                res.json({status : 0, message : "No fue posible consultar", err});
                console.log(err);
            } else {
                result.rows.forEach((element)=>{
                    arregloRetorno.push({publicacion : element, etiquetas : []});
                });
                consulta = `SELECT P.codigopublicacion, nombretag FROM PublicacionTags T, Publicacion P WHERE codigogrupo IN (SELECT codigo FROM GruposMiembros WHERE username = '${req.params.username}') AND P.codigopublicacion = T.codigopublicacion ORDER BY fecha DESC`;
                pool.query(consulta,(err,result)=>{
                    if(err) {
                        res.json({status : 0, message : "No fue posible consultar", err});
                        console.log(err);
                    } else {
                        for(let i=0;i < result.rows.length;i++) {
							for(let j=0;j < arregloRetorno.length;j++) {
								if(arregloRetorno[j].publicacion.codigopublicacion === result.rows[i].codigopublicacion) {
									arregloRetorno[j].etiquetas.push(result.rows[i].nombretag);
								}
							}
						}
                        res.json({status : 1, message : "Consulta exitosa", resultado : arregloRetorno});
                    }
                });
            }
        }); 
	});
};