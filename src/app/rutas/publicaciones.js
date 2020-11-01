const pool = require('../../config/db');

module.exports = (app) => {
    
    app.get('/vercomentarios/:codigopublicacion', (req, res)=>{
        consulta = `SELECT * FROM Comentario WHERE codigopublicacion = '${req.params.codigopublicacion}' ORDER BY fecha ASC`;
        arregloRetorno = [];
        pool.query(consulta, (err, result)=>{
            if(err) {
                res.json({status : 0, message : "No fue posible consultar", err});
                console.log(err);
            } else {
                if(result.rows.length === 0) {
                    res.json({status : 1, message : "Consulta exitosa", resultado : []});
                } else {
                    stringComentarios = "(";
                    result.rows.forEach((element)=>{
                        arregloRetorno.push({comentario : element, respuestas : []});
                        stringComentarios = stringComentarios + "'"  + element.codigocomentario + "'" + ",";
                    });
                    stringComentarios = stringComentarios.substring(0, stringComentarios.length - 1);
                    stringComentarios = stringComentarios + ")";
                    consulta = `SELECT * FROM Respuesta WHERE codigocomentario IN ` + stringComentarios + ` ORDER BY fecha ASC`;
                    pool.query(consulta, (err, result)=>{
                        if(err) {
                            res.json({status : 0, message : "No fue posible consultar", err});
                            console.log(err);
                        } else {
                            for(let i=0;i < result.rows.length;i++) {
                                for(let j=0;j < arregloRetorno.length;j++) {
                                    if(arregloRetorno[j].comentario.codigocomentario === result.rows[i].codigocomentario) {
                                        arregloRetorno[j].respuestas.push(result.rows[i]);
                                    }
                                }
                            }
                            res.json({status : 1, message : "Consulta exitosa", resultado : arregloRetorno});
                        }
                    });//
                }
            }
        });
    });

    app.post('/publicarcomentario', (req,res)=>{
        consulta = `SELECT count(*) AS cuenta FROM Comentario WHERE codigopublicacion = '${req.body.codigopublicacion}'`;
        pool.query(consulta, (err,result)=>{
            if(err) {
                res.json({status : 0, message : "No fue posible insertar", err});
                console.log(err);
            } else {
                let codigo = req.body.codigopublicacion;
                let cuenta = result.rows[0].cuenta;
                if(cuenta < 10) {
                    codigo = codigo + '0000' + cuenta;
                } 
                if(cuenta >= 10 && cuenta < 100) {
                    codigo = codigo + '000' + cuenta;
                }
                if(cuenta >= 100 && cuenta < 1000) {
                    codigo = codigo + '00' + cuenta;
                }
                if(cuenta >= 1000 && cuenta < 10000) {
                    codigo = codigo + '0' + cuenta;
                }
                consulta = `INSERT INTO Comentario VALUES (0, '${req.body.contenido}', '${codigo}', '${req.body.codigopublicacion}', '${req.body.usuario}', to_timestamp(${Date.now()}/1000.0))`;
                pool.query(consulta, (err, result)=>{
                    if(err) {
                        res.json({status : 0, message : "No fue posible insertar", err});
                        console.log(err);
                    } else {
                        res.json({status : 1, message : "Insercion realizada", result});
                    }
                });
            }
        });
    });

    app.post('/publicarrespuesta', (req,res)=>{
        consulta = `SELECT count(*) AS cuenta FROM Respuesta WHERE codigocomentario = '${req.body.codigocomentario}'`;
        pool.query(consulta,(err,result)=>{
            if(err) {
                res.json({status : 1, message : "No fue posible insertar", err});
                console.log(err);
            } else {
                let codigo = req.body.codigocomentario;
                let cuenta = result.rows[0].cuenta;
                if(cuenta < 10) {
                    codigo = codigo + '0000' + cuenta;
                } 
                if(cuenta >= 10 && cuenta < 100) {
                    codigo = codigo + '000' + cuenta;
                }
                if(cuenta >= 100 && cuenta < 1000) {
                    codigo = codigo + '00' + cuenta;
                }
                if(cuenta >= 1000 && cuenta < 10000) {
                    codigo = codigo + '0' + cuenta;
                }
                consulta = `INSERT INTO Respuesta VALUES ('${req.body.contenido}','${codigo}','${req.body.codigocomentario}','${req.body.username}',to_timestamp(${Date.now()}/1000.0))`;
                pool.query(consulta,(err,result)=>{
                    if(err) {
                        res.json({status : 0, message : "No fue posible insertar", err});
                        console.log(err);
                    } else {
                        res.json({status : 1, message : "Insercion realizada", result});
                    }
                });
            }
        });
    });

};