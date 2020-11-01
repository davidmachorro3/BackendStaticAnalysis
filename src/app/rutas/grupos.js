const pool = require('../../config/db');

const letras = "abcdefghijklmnopqrstuvwxyz";

var cantidadEtiquetas = 0;
var contadorGlobal = 0;
var resGlobal;
var reqGlobal;
var codigoGlobal = '';
var clientGlobal;
function doneGlobal() { }

function generarLetra() {
    return letras[Math.floor(Math.random()*26)];
}

function recursiveInsert2(err,result) {
    if(err) {
        resGlobal.json({status : 0, message : "No fue posible insertar", err});
        console.log(err);
        doneGlobal();
    } else {
        contadorGlobal++;
        if(contadorGlobal === cantidadEtiquetas) {
            consulta = `COMMIT`;
            clientGlobal.query(consulta,(e,r)=>{
                if(e) {
                    resGlobal.json({status : 0, message : "No fue posible insertar", e});
                    console.log(e);
                    doneGlobal();
                }
                else {
                    resGlobal.json({status : 1, message : "Publicacion insertada", e});
                    doneGlobal();
                }    
            });
        } else {
            consulta = `UPDATE TagsGrupos SET numeropublicaciones = numeropublicaciones + 1 WHERE nombretag = '${reqGlobal.body.etiquetas[contadorGlobal]}' AND codigogrupo = '${reqGlobal.body.codigo}'`;
            clientGlobal.query(consulta,(e,r)=>{
                if(e) {
                    resGlobal.json({status : 0, message : "No fue posible insertar", e});
                    console.log(e);
                    doneGlobal();
                } else {
                    recursiveInsert2(err,result);
                }
            });
        }
    }
}

function recursiveInsert(err,result) {
    if(err) {
        resGlobal.json({status : 0, message : "No fue posible insertar", err});
        console.log(err);
        doneGlobal();
    } else {
        if(contadorGlobal === cantidadEtiquetas) {
            contadorGlobal = 0;
            consulta = `UPDATE TagsGrupos SET numeropublicaciones = numeropublicaciones + 1 WHERE nombretag = '${reqGlobal.body.etiquetas[contadorGlobal]}' AND codigogrupo = '${reqGlobal.body.codigo}'`;
            clientGlobal.query(consulta,recursiveInsert2);
        } else {
            consulta = `INSERT INTO PublicacionTags VALUES ('${codigoGlobal}','${reqGlobal.body.etiquetas[contadorGlobal]}')`;
            clientGlobal.query(consulta,(e,r)=>{
                if(e) {
                    resGlobal.json({status : 0, message : "No fue posible insertar", e});
                    console.log(e);
                    doneGlobal();
                }
                else {
                    contadorGlobal++;
                    recursiveInsert(err,result);
                }
            });
        }
    }
}

module.exports = (app) => {

    app.post('/creargrupo',(req,res)=>{
        consulta = `BEGIN;`;
        pool.query(consulta,(err,result)=>{
            if(err) {
                res.json({status : 0, message : "No fue posible insertar", err});
                console.log(err);
            }
            else {
                consulta = `SELECT count(*) AS cuenta FROM Grupo`;
                pool.query(consulta,(err,result)=>{
                    let cuenta = result.rows[0].cuenta;
                    let prefijo = '';
                    for(let i = 0; i < 4; i++) {
                        prefijo = prefijo + generarLetra();
                    }
                    let codigo = '';
                    if(cuenta < 10) {
                        codigo = prefijo + '0000' + cuenta;
                    } 
                    if(cuenta >= 10 && cuenta < 100) {
                        codigo = prefijo + '000' + cuenta;
                    }
                    if(cuenta >= 100 && cuenta < 1000) {
                        codigo = prefijo + '00' + cuenta;
                    }
                    if(cuenta >= 1000 && cuenta < 10000) {
                        codigo = prefijo + '0' + cuenta;
                    }
                    consulta = `INSERT INTO Grupo (nombre,codigo,tema,nivelacceso,passwrd,numeromiembros,descripcion) VALUES ('${req.body.nombre}','${codigo}','${req.body.tema}','${req.body.nivelacceso}','${req.body.passwrd}',1,'${req.body.descripcion}') RETURNING codigo;`;
                    pool.query(consulta,(err,result)=>{
			            if(err) {
                            res.json({status : 0, message : "No fue posible insertar", err});
                            console.log(err);
                        }
                        else {
                            let codigo = result.rows[0].codigo;
                            consulta = `INSERT INTO GruposMiembros VALUES ('${req.body.username}','${codigo}','1');`;
                            pool.query(consulta,(err,result)=>{
                                if(err) {
                                    res.json({status : 0, message : "No fue posible insertar", err});
                                    console.log(err);
                                }
                                else {
                                    consulta = `COMMIT`;
                                    pool.query(consulta,(err,result)=>{
                                        if(err) {
                                            res.json({status : 0, message : "No fue posible insertar", err});
                                            console.log(err);
                                        }
                                        else res.json({status : 1, message : "Insercion exitosa"});
                                    });
                                }
                            });
                        }
                    }); 
                });
            }
        });
    });

    app.get('/vergrupos/:username',(req,res)=>{
        consulta = `SELECT nombre,tema, G.codigo FROM Grupo G,GruposMiembros M WHERE G.codigo = M.codigo AND M.username = '${req.params.username}'`;
        pool.query(consulta,(err,result)=>{
            if(err) res.json({status : 0, message : "No fue posible consultar los grupos"});
            else res.json({status : 1, message : "Consulta exitosa", resultado : result.rows});
        });
    });

    app.get('/vergruposdestacados/:username',(req,res)=>{
        consulta = `SELECT nombre, tema, numeromiembros, descripcion, M.codigo FROM Grupo G, GruposMiembros M WHERE G.codigo = M.codigo AND M.username = '${req.params.username}' ORDER BY numeromiembros DESC LIMIT 5`;
        pool.query(consulta,(err,result)=>{
            if(err) res.json({status : 0, message : "No fue posible consultar los grupos", error : err});
            else res.json({status : 1, message : "Consulta exitosa", resultado : result.rows});
        });
    });

    app.get('/vergrupo/:codigo',(req,res)=>{
        consulta = `SELECT * FROM Grupo WHERE codigo = '${req.params.codigo}'`;
        pool.query(consulta,(err,result)=>{
            if(err) res.json({status : 0, message : "No fue posible consultar el grupo", error : err});
            else res.json({status : 1, message : "Consulta exitosa", resultado : result.rows});
        });
    });

    app.get('/vermiembrogrupo/:codigo/:username',(req,res)=>{
        consulta = `SELECT * FROM GruposMiembros WHERE codigo = '${req.params.codigo}' AND username = '${req.params.username}'`;
        pool.query(consulta,(err,result)=>{
            if(err) res.json({status : 0, message : "No fue posible consultar", error : err});
            else res.json({status : 1, message : "Consulta exitosa", resultado : result.rows});
        });
    });

    app.post('/agregarmiembro',(req,res)=>{
        consulta = `BEGIN`;
        pool.query(consulta,(err,result)=>{
            if(err) {
                res.json({status : 0, message : "No fue posible agregar al usuario", error : err});
                console.log(err);
            } else {
                consulta = `INSERT INTO GruposMiembros VALUES ('${req.body.username}','${req.body.codigo}','${req.body.esAdmin}')`;
                pool.query(consulta,(err,result)=>{
                    if(err) {
                        res.json({status : 0, message : "No fue posible agregar al usuario", error : err});
                        console.log(err);
                    }
                    else {
                        consulta = `UPDATE Grupo SET numeromiembros = numeromiembros + 1 WHERE codigo = '${req.body.codigo}'`;
                        pool.query(consulta,(err,result)=>{
                            if(err) {
                                res.json({status : 0, message : "No fue posible agregar al usuario", error : err});
                                console.log(err);
                            } else {
                                consulta = `COMMIT`;
                                pool.query(consulta,(err,result)=>{
                                    if(err) {
                                        res.json({status : 0, message : "No fue posible agregar al usuario", error : err});
                                        console.log(err);
                                    } else res.json({status : 1, message : "Usuario agregado exitosamente", resultado : result.rows});
                                });
                            }
                        }); 
                    }
                });
            }
        });
    });

    app.get('/vergrupos/:nivelacceso/:numeromiembros/:tema',(req,res)=>{
        let consulta;
        if(req.params.nivelacceso === '2') {
            if(req.params.tema === '-') {
                consulta = `SELECT * FROM Grupo WHERE numeromiembros >= ${req.params.numeromiembros}`;
            } else {
                consulta = `SELECT * FROM Grupo WHERE numeromiembros >= ${req.params.numeromiembros} AND tema = '${req.params.tema}'`;
            }
        } else {
            if(req.params.tema === '-') {
                consulta = `SELECT * FROM Grupo WHERE numeromiembros >= ${req.params.numeromiembros} AND nivelacceso = '${req.params.nivelacceso}'`;
            } else {
                consulta = `SELECT * FROM Grupo WHERE nivelacceso = '${req.params.nivelacceso}' AND numeromiembros >= ${req.params.numeromiembros} AND tema = '${req.params.tema}'`;
            }
        }
        pool.query(consulta,(err,result)=>{
            if(err) res.json({status : 0, message : "No fue posible consultar los grupos", error : err});
            else res.json({status : 1, message : "Grupos obtenidos exitosamente", resultado : result.rows});
        });
    });

    app.get('/versiadmin/:codigo/:username',(req,res)=>{
        consulta = `SELECT esadmin FROM GruposMiembros WHERE codigo = '${req.params.codigo}' AND username = '${req.params.username}'`;
        pool.query(consulta,(err,result)=>{
            if(err) res.json({status : 0, message : "Ocurrio un error", error : err});
            else res.json({status : 1, message : "Informacion obtenida", resultado : result.rows});
        });
    });

    app.get('/vertags',(req,res)=>{
        consulta = `SELECT * FROM Tag`;
        pool.query(consulta,(err,result)=>{
            if(err) res.json({status : 0, message : "Ocurrio un error", error : err});
            else res.json({status : 1, message : "Informacion obtenida", resultado : result.rows});
        });
    });

    app.get('/vertags/:codigo',(req,res)=>{
        consulta = `SELECT nombreTag FROM TagsGrupos WHERE codigoGrupo = '${req.params.codigo}'`;
        pool.query(consulta,(err,result)=>{
            if(err) res.json({status : 0, message : "Ocurrio un error", error : err});
            else res.json({status : 1, message : "Informacion obtenida", resultado : result.rows});
        });
    });

    app.post('/agregartag',(req,res)=>{
        let consulta;
        if(req.body.tipoGuardado === 0) {
            consulta = `INSERT INTO TagsGrupos VALUES ('${req.body.nombre}','${req.body.codigo}',0)`;
            pool.query(consulta,(err,result)=>{
                if(err) res.json({status : 0, message : "No se pudo agregar la etiqueta", error : err});
                else res.json({status : 1, message : "Etiqueta agregada", resultado : result.rows});
            });
        } else {
            consulta = `BEGIN`;
            pool.query(consulta,(err,result)=>{
                if(err) {
                    res.json({status : 0, message : "No se pudo agregar la etiqueta", error : err});
                    console.log(err);
                } else {
                    consulta = `INSERT INTO Tag VALUES ('${req.body.nombre}')`;
                    pool.query(consulta,(err,result)=>{
                        if(err) {
                            res.json({status : 0, message : "No se pudo agregar la etiqueta", error : err});
                            console.log(err);
                        } else {
                            consulta = `INSERT INTO TagsGrupos VALUES ('${req.body.nombre}','${req.body.codigo}',0)`;
                            pool.query(consulta,(err,result)=>{
                                if(err) {
                                    res.json({status : 0, message : "No se pudo agregar la etiqueta", error : err});
                                    console.log(err);
                                } else {
                                    consulta = `COMMIT`;
                                    pool.query(consulta,(err,result)=>{
                                        if(err) {
                                            res.json({status : 0, message : "No se pudo agregar la etiqueta", error : err});
                                            console.log(err);
                                        } else {
                                            res.json({status : 1, message : "Etiqueta agregada", resultado : result.rows});
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    app.post('/agregarpublicacion',(req,res)=>{
        pool.connect((err,client,done)=>{
            let consulta = `BEGIN`; 
            client.query(consulta,(err,result)=>{
                if(err) {
                    res.json({status : 0, message : "No fue posible insertar", err});
                    console.log(err);
                    done();
                }
                else {
                    consulta = `SELECT count(*) AS cuenta FROM Publicacion WHERE codigogrupo = '${req.body.codigo}'`;
                    client.query(consulta,(err,result)=>{
                        if(err) {
                            res.json({status : 0, message : "No fue posible insertar", err});
                            console.log(err);
                            done();
                        } else {
                            let cuenta = result.rows[0].cuenta;
                            let prefijo = req.body.codigo;
                            codigoGlobal = '';
                            if(cuenta < 10) {
                                codigoGlobal = prefijo + '0000' + cuenta;
                            } 
                            if(cuenta >= 10 && cuenta < 100) {
                                codigoGlobal = prefijo + '000' + cuenta;
                            }
                            if(cuenta >= 100 && cuenta < 1000) {
                                codigoGlobal = prefijo + '00' + cuenta;
                            }
                            if(cuenta >= 1000 && cuenta < 10000) {
                                codigoGlobal = prefijo + '0' + cuenta;
                            }
                            consulta = `INSERT INTO Publicacion VALUES ('${codigoGlobal}','${req.body.codigo}','${req.body.username}','${req.body.titulo}', to_timestamp(${Date.now()}/1000.0),'${req.body.contenido}')`;
                            cantidadEtiquetas = req.body.etiquetas.length;
                            resGlobal = res;
                            reqGlobal = req;
                            clientGlobal = client;
                            contadorGlobal = 0;
                            doneGlobal = done;
                            if(cantidadEtiquetas === 0) {
                                client.query(consulta,(err,result)=>{
                                    if(err) {
                                        res.json({status : 0, message : "No fue posible insertar", err});
                                        console.log(err);
                                        done();
                                    } else {
                                        consulta = `COMMIT`;
                                        client.query(consulta,(err,result)=>{
                                            if(err) {
                                                res.json({status : 0, message : "No fue posible insertar", err});
                                                console.log(err);
                                                done();
                                            } else res.json({status : 1, message : "Usuario agregado exitosamente", resultado : result.rows});
                                        });
                                    }
                                });
                            } else {
                                client.query(consulta,recursiveInsert);
                            }

                        }
                    });
                }
            });//
        });    
    });

    app.get('/verpublicacion/:codigo/:codigogrupo',(req,res)=>{
        consulta = `SELECT * FROM Publicacion WHERE codigopublicacion = '${req.params.codigo}' AND codigogrupo = '${req.params.codigogrupo}'`;
        let arregloRetorno = [];
        pool.query(consulta,(err,result)=>{
            if(err) {
                res.json({status : 0, message : "No fue posible consultar", err});
                console.log(err);
            } else {
                if(result.rows.length !== 0) arregloRetorno.push({publicacion : result.rows[0], etiquetas : []});
                consulta = `SELECT nombretag FROM PublicacionTags WHERE codigopublicacion = '${req.params.codigo}'`;
                pool.query(consulta,(err,result)=>{
                    if(err) {
                        res.json({status : 0, message : "No fue posible consultar", err});
                        console.log(err);
                    } else {
                        if(arregloRetorno.length !== 0) {
                            result.rows.forEach((element)=>{
                                arregloRetorno[0].etiquetas.push(element.nombretag);
                            });
                        }
                        res.json({status : 1, message : "Consulta exitosa", resultado : arregloRetorno});
                    }
                });
            }
        });
    });

    app.get('/verpublicaciones/:codigo',(req,res)=>{
        consulta = `SELECT * FROM Publicacion WHERE codigogrupo = '${req.params.codigo}' ORDER BY codigopublicacion DESC`;
        arregloRetorno = [];
        pool.query(consulta,(err,result)=>{
            if(err) {
                res.json({status : 0, message : "No fue posible consultar", err});
                console.log(err);
            } else {
                result.rows.forEach((element)=>{
                    arregloRetorno.push({publicacion : element, etiquetas : []});
                });
                consulta = `SELECT P.codigopublicacion, nombretag FROM PublicacionTags T, Publicacion P WHERE codigogrupo = '${req.params.codigo}' AND P.codigopublicacion = T.codigopublicacion ORDER BY codigopublicacion DESC`;
                pool.query(consulta,(err,result)=>{
                    if(err) {
                        res.json({status : 0, message : "No fue posible consultar", err});
                        console.log(err);
                    } else {
                        let contador = 0;
                        result.rows.forEach((element)=>{
                            if(element.codigopublicacion === arregloRetorno[contador].publicacion.codigopublicacion) {
                                arregloRetorno[contador].etiquetas.push(element.nombretag);
                            } else {
                                while(element.codigopublicacion !== arregloRetorno[contador].publicacion.codigopublicacion) {
                                    contador++;
                                }
                                arregloRetorno[contador].etiquetas.push(element.nombretag);
                            }
                        });
                        res.json({status : 1, message : "Consulta exitosa", resultado : arregloRetorno});
                    }
                });
            }
        }); 
    });

    app.get('/verpublicaciones/:codigo/:nombre/:inicio/:fin/:listaetiquetas',(req,res)=>{
        let etiquetasRequeridas = req.params.listaetiquetas.split("~");
        let consulta;
        let arregloRetorno = [];
        if(req.params.inicio === "-") {
            if(req.params.fin === "-") {
                if(req.params.listaetiquetas === "-") {
                    consulta = `SELECT * FROM Publicacion WHERE codigogrupo = '${req.params.codigo}' ORDER BY codigopublicacion DESC`;
                } else {
                    consulta = `(SELECT P.codigopublicacion, codigogrupo, username, titulo, fecha, contenido FROM PublicacionTags T, Publicacion P WHERE P.codigopublicacion = T.codigopublicacion AND nombretag = '${etiquetasRequeridas[0]}'`;
                    for(let i=1;i < etiquetasRequeridas.length;i++) {
                        consulta = consulta + ' INTERSECT ' + `SELECT P.codigopublicacion, codigogrupo, username, titulo, fecha, contenido FROM PublicacionTags T, Publicacion P WHERE P.codigopublicacion = T.codigopublicacion AND nombretag = '${etiquetasRequeridas[i]}'`;
                    }
                    consulta = consulta + ') ORDER BY codigopublicacion DESC';
                }
            } else {
                if(req.params.listaetiquetas === "-") {
                    consulta = `SELECT * FROM Publicacion WHERE codigogrupo = '${req.params.codigo}' AND DATE(fecha) <= '${req.params.fin}' ORDER BY codigopublicacion DESC`;
                } else {
                    consulta = `(SELECT * FROM Publicacion WHERE codigogrupo = '${req.params.codigo}' AND DATE(fecha) <= '${req.params.fin}'`;
                    for(let i=0;i < etiquetasRequeridas.length;i++) {
                        consulta = consulta + ' INTERSECT ' + `SELECT P.codigopublicacion, codigogrupo, username, titulo, fecha, contenido FROM PublicacionTags T, Publicacion P WHERE P.codigopublicacion = T.codigopublicacion AND nombretag = '${etiquetasRequeridas[i]}'`;
                    }
                    consulta = consulta + ') ORDER BY codigopublicacion DESC';
                }
            }
        } else {
            if(req.params.fin === "-") {
                if(req.params.listaetiquetas === "-") {
                    consulta = `SELECT * FROM Publicacion WHERE codigogrupo = '${req.params.codigo}' AND DATE(fecha) >= '${req.params.inicio}' ORDER BY codigopublicacion DESC`;
                } else {
                    consulta = `(SELECT P.codigopublicacion, codigogrupo, username, titulo, fecha, contenido FROM PublicacionTags T, Publicacion P WHERE P.codigopublicacion = T.codigopublicacion AND nombretag = '${etiquetasRequeridas[0]}' AND DATE(fecha) >= '${req.params.inicio}'`;
                    for(let i=1;i < etiquetasRequeridas.length;i++) {
                        consulta = consulta + ' INTERSECT ' + `SELECT P.codigopublicacion, codigogrupo, username, titulo, fecha, contenido FROM PublicacionTags T, Publicacion P WHERE P.codigopublicacion = T.codigopublicacion AND nombretag = '${etiquetasRequeridas[i]}'`;
                    }
                    consulta = consulta + ') ORDER BY codigopublicacion DESC';
                }
            } else {
                if(req.params.listaetiquetas === "-") {
                    consulta = `SELECT * FROM Publicacion WHERE codigogrupo = '${req.params.codigo}' AND DATE(fecha) <= '${req.params.fin}' AND DATE(fecha) >= '${req.params.inicio}' ORDER BY codigopublicacion DESC`;
                } else {
                    consulta = `(SELECT * FROM Publicacion WHERE codigogrupo = '${req.params.codigo}' AND DATE(fecha) <= '${req.params.fin}' AND DATE(fecha) >= '${req.params.inicio}'`;
                    for(let i=0;i < etiquetasRequeridas.length;i++) {
                        consulta = consulta + ' INTERSECT ' + `SELECT P.codigopublicacion, codigogrupo, username, titulo, fecha, contenido FROM PublicacionTags T, Publicacion P WHERE P.codigopublicacion = T.codigopublicacion AND nombretag = '${etiquetasRequeridas[i]}'`;
                    }
                    consulta = consulta + ') ORDER BY codigopublicacion DESC';
                }
            }
        }
        pool.query(consulta,(err,result)=>{
            if(err) {
                res.json({status : 0, message : "No fue posible consultar", err});
                console.log(err);
            } else {    
                result.rows.forEach((element)=>{
                    arregloRetorno.push({publicacion : element, etiquetas : []});
                });
                consulta = `SELECT P.codigopublicacion, nombretag FROM PublicacionTags T, Publicacion P WHERE codigogrupo = '${req.params.codigo}' AND P.codigopublicacion = T.codigopublicacion ORDER BY codigopublicacion DESC`;
                pool.query(consulta,(err,result)=>{
                    if(err){
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
            }//
        });
    });

    app.get('/verpublicacionestexto/:texto/:codigo',(req,res)=>{
        consulta = `SELECT * FROM Publicacion WHERE titulo LIKE '%${req.params.texto}%' AND codigogrupo = '${req.params.codigo}' ORDER BY codigopublicacion DESC`;
        arregloRetorno = [];
        pool.query(consulta,(err,result)=>{
            if(err) {
                res.json({status : 0, message : "No fue posible consultar", err});
                console.log(err);
            } else {
                result.rows.forEach((element)=>{
                    arregloRetorno.push({publicacion : element, etiquetas : []});
                });
                consulta = `SELECT P.codigopublicacion, nombretag FROM PublicacionTags T, Publicacion P WHERE codigogrupo = '${req.params.codigo}' AND P.codigopublicacion = T.codigopublicacion ORDER BY codigopublicacion DESC`;
                pool.query(consulta,(err,result)=>{
                    if(err){
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
            }//
        });
    });

    app.get('/vergrupostexto/:texto',(req,res)=>{
        consulta = `SELECT * FROM Grupo WHERE nombre LIKE '%${req.params.texto}%'`;
        pool.query(consulta,(err,result)=>{
            if(err) {
                res.json({status : 0, message : "No fue posible consultar", err});
                console.log(err);
            } else {
                res.json({status : 1, message : "Consulta exitosa", resultado : result.rows})
            }
        });
    });

    app.get('/verpublicacionesdestacadas/:usuario/:codigo',(req,res)=>{
        consulta = `SELECT codigopublicacion, codigogrupo, username, titulo, fecha, contenido, nombre FROM Publicacion P, Grupo G WHERE P.codigogrupo = G.codigo AND username = '${req.params.usuario}' AND G.codigo = '${req.params.codigo}' ORDER BY codigopublicacion DESC LIMIT 5`;
        arregloRetorno = [];
        pool.query(consulta, (err,result)=>{
            if(err) {
                res.json({status : 0, message : "No fue posible consultar", err});
                console.log(err);
            } else {
                result.rows.forEach((element)=>{
                    arregloRetorno.push({publicacion : element, etiquetas : []});
                });
                consulta = `SELECT P.codigopublicacion, nombretag FROM PublicacionTags T, Publicacion P WHERE codigogrupo = '${req.params.codigo}' AND P.codigopublicacion = T.codigopublicacion ORDER BY codigopublicacion DESC`;
                pool.query(consulta,(err,result)=>{
                    if(err){
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
}