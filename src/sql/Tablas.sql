
CREATE DATABASE Proyecto6toSemestre;

--USE Proyecto6toSemestre;

CREATE TABLE Usuario (
	username varchar(50),
    nombre varchar(50),
    passwrd varchar(125),
    PRIMARY KEY(username)
);

CREATE TABLE Grupo ( 
	nombre varchar(100),
    codigo char(9),
    tema varchar(50),
    nivelAcceso char(1),
    passwrd varchar(125),
    numeroMiembros int,
    descripcion text,
    PRIMARY KEY(codigo)
);

CREATE TABLE GruposMiembros (
    username varchar(50),
    codigo char(9),
    esAdmin char(1),
    PRIMARY KEY(codigo,username),
    FOREIGN KEY(username) REFERENCES Usuario(username),
    FOREIGN KEY(codigo) REFERENCES Grupo(codigo)
);

CREATE TABLE Publicacion (
	codigoPublicacion char(14),
    codigoGrupo char(9),
    username varchar(50),
    titulo varchar(100),
    fecha timestamp,
    contenido text,
    PRIMARY KEY(codigoPublicacion),
    FOREIGN KEY(username) REFERENCES Usuario(username),
    FOREIGN KEY(codigoGrupo) REFERENCES Grupo(codigo) ON DELETE CASCADE
);

CREATE TABLE Tag (
	nombre varchar(30),
    PRIMARY KEY(nombre)
);

CREATE TABLE TagsGrupos (
	nombreTag varchar(30),
    codigoGrupo char(9),
    numeroPublicaciones int,
    PRIMARY KEY(nombreTag,codigoGrupo),
    FOREIGN KEY(nombreTag) REFERENCES Tag(nombre) ON DELETE CASCADE,
    FOREIGN KEY(codigoGrupo) REFERENCES Grupo(codigo) ON DELETE CASCADE
);

CREATE TABLE PublicacionTags (
	codigoPublicacion char(14),
    nombreTag varchar(30),
    PRIMARY KEY(codigoPublicacion,nombreTag),
    FOREIGN KEY(codigoPublicacion) REFERENCES Publicacion(codigoPublicacion) ON DELETE CASCADE,
    FOREIGN KEY(nombreTag) REFERENCES Tag(nombre) ON DELETE CASCADE
);

CREATE TABLE Comentario (
	numeroAprobaciones int,
    contenido text,
    codigoComentario char(19),
    codigoPublicacion char(14),
    username varchar(50),
    fecha timestamp,
    PRIMARY KEY(codigoComentario),
    FOREIGN KEY(codigoPublicacion) REFERENCES Publicacion(codigoPublicacion) ON DELETE CASCADE,
    FOREIGN KEY(username) REFERENCES Usuario(username)
);

CREATE TABLE Respuesta (
	contenido text,
    codigoRespuesta char(24),
    codigoComentario char(19),
    username varchar(50),
    fecha timestamp,
    PRIMARY KEY(codigoRespuesta),
    FOREIGN KEY(codigoComentario) REFERENCES Comentario(codigoComentario) ON DELETE CASCADE,
    FOREIGN KEY(username) REFERENCES Usuario(username)
);




