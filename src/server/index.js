//INFO: servidor estandar para demos y clientes simples

//OjO! cuidar seguridad, limpiar SIEMPRE nombres de archivo y solo dejar subir extensiones SEGURAS, sin ".." ni barras ni caracteres que no sean a-zA-Z0-9_ en el nombre
//OjO! cuidar tamaño maximo en uploads
//OjO! nunca poner nombres ni datos de clientes

//TODO : funciones asincronas name_a
//TODO: validar y formatear json recibido?
//TODO: algun tipo de token, no pisar archivos a lo bestia ...

CfgPortDflt= 8888; //U: el puerto donde escuchamos si no nos pasan PORT en el ambiente
CfgDbBaseDir= 'DATA'; //A: los datos se guardar aqui
CfgDbMissionResultsBaseDir= CfgDbBaseDir + '/missions';

CfgUploadSzMax = 50 * 1024 * 1024; //A: 50MB max file(s) size 

//----------------------------------------------------------
//S: dependencias
var express = require('express');
var bodyParser = require('body-parser');
var os = require('os'); //A: para interfases
var fs = require('fs');
var fileUpload = require('express-fileupload');
const _path = require('path');
var fetch = require('node-fetch');
var crypto = require('crypto');
var fsExtra = require('fs-extra');
var open = require('open');
//const https = require('https');
var https = require('follow-redirects').https; //VER: https://stackoverflow.com/questions/31615477/how-download-file-from-github-com-whith-nodejs-https

//------------------------------------------------------------------
//S: util
function net_interfaces() { //U: conseguir las interfases de red
	//SEE: https://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
	var r= {};
	var ifaces = os.networkInterfaces();
	Object.keys(ifaces).forEach(function (ifname) {
		var alias = 0;

		ifaces[ifname].forEach(function (iface) {
			if ('IPv4' !== iface.family || iface.internal !== false) {
				return; //A: skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
			}

			if (alias >= 1) { //A this single interface has multiple ipv4 addresses
					r[ifname + ':' + alias]= iface.address;
			} else { //A: this interface has only one ipv4 adress
					r[ifname]= iface.address;
			}
			++alias;
		});
	});

	// en0 -> 192.168.1.101
	// eth0 -> 10.0.0.101
	return r;
}

function leerMisiones(rutaOrigen) {
	var r = new Array();
	fs.readdirSync(rutaOrigen).forEach(protocolo => {
		protocolo = protocolo || [];
		var rutaProtocolo = _path.join(rutaOrigen, protocolo);
		fs.readdirSync(rutaProtocolo).forEach(file => {
			file = file || [];
			if (file == 'missions'){ //A quiero devolver las misiones que se encuentran en la carpeta 'missions'
				var rutaProtocoloMision = _path.join(rutaProtocolo, file);
				if (fs.existsSync(rutaProtocoloMision)) { //A: puede no haber misiones para un protocolo
					fs.readdirSync(rutaProtocoloMision).forEach(mision => {
						mision = mision || [];
						ruta = rutaCarpeta(rutaProtocoloMision, mision, null, 'state.json', false);
						if (fs.existsSync(ruta)){
							r.push(leerJson(ruta))
						}	
					});
				}
			}
		});
	});
	return r;
}


const downloadFile = (async (url, path) => {//U: descarga un archivo de una url y lo guarda en un destino recibe un cb cuando finaliza
	const res = await fetch(url);
	const fileStream = fs.createWriteStream(path);
	await new Promise((resolve, reject) => {
		res.body.pipe(fileStream);
		res.body.on("error", (err) => {
		  reject(err);
		});
		fileStream.on("finish", function() {
		  resolve();
		});
	  });
});

function leerJsonProtocols(ruta, cb) { //U: devuelve un kv protocolo=carpeta -> contenido index.json, para cada carpeta en la ruta
	var r= {};
	fs.readdir(ruta, function(err, carpetas) {
		if (err) cb({ERROR: 'reading folders'})
		else{
			carpetas= carpetas || []; //A: puede no venir ninguna
			carpetas.forEach(protocolo => {
				var path = rutaCarpeta(ruta, protocolo, null, 'index.json', false);
				var data = fs.existsSync(path) ? leerJson(path) : {};
				r[protocolo]= data;
			});
			cb(r)
		}
	})
}

function leerJson(ruta){
	return JSON.parse(fs.readFileSync(ruta));
}

//U: reemplaza extensiones de archivos no aceptadas y caracteres peligrosos por seguros
/*
limpiarFname("../../esoy un path \\Malvado.exe");
limpiarFname("TodoBien.json");
limpiarFname("TodoCasiBien.Json");
limpiarFname("Ok.mp3");
*/
function limpiarFname(fname, dfltExt) {
	var fnameYext= fname.match(/(.+?)(\.(mp4|mov|avi|mp3|wav|png|jpg|json|txt|md|pdf))/) || ["", fname, dfltExt||""];
	//A: o tiene una extension aceptada, o le ponemos dfltExt o ""
	var fnameSinExt= fnameYext[1];
	var fnameLimpio= fnameSinExt.replace(/[^a-z0-9_-]/gi, "_") + fnameYext[2];
	//A: en el nombre si no es a-z A-Z 0-9 _ o - reemplazo por _ , y agrego extension aceptada
	return fnameLimpio;
}

//U: devuelve la ruta a la carpeta o archivo si wantsCreate es true la crea sino null
function rutaCarpeta(rutaPfx, folderId, secondfolderId, file, wantsCreate) {
	folderId = limpiarFname(folderId||"_0SinProtocolo_");
	file = file!=null && limpiarFname(file, ".dat");

	var rutaCarpeta = `${rutaPfx}/${folderId}`;
	if (secondfolderId){
		secondfolderId = limpiarFname(secondfolderId);
		rutaCarpeta = `${rutaCarpeta}/missions/${secondfolderId}`;
	}

	if (!fs.existsSync(rutaCarpeta)) { 
		if (wantsCreate) { fs.mkdirSync(rutaCarpeta, {recursive: true}); }
			//A: cree la carpeta para la mision Y todas las que hagan falta para llegar ahi
		else { return null; }
	}
	//A:tenemos carpeta

	return (file ? `${rutaCarpeta}/${file}` : rutaCarpeta);
}
//   TESTS
//   console.log(rutaCarpeta(CfgDbBaseDir, "mantenimientoTurbina", null, false)) //A: devuelve ruta a protocolo en especifico
//   console.log(rutaCarpeta( path.join(CfgDbBaseDir, "mantenimientoTurbina", "missions"), "misionMantenimientoTurbina_1", null, false))//A: devuelve ruta  a mission especifica
//   console.log(rutaCarpeta( path.join(CfgDbBaseDir, "mantenimientoTurbina", "missions"), "misionNueva", null, true))//A: crear carpeta para mision
//   console.log(rutaCarpeta( path.join(CfgDbBaseDir, "mantenimientoTurbina", "missions"), "misionFalsa", null, false))//A: no crea carpeta para mision

//U: recibe la ruta de un archivo y devuelve un hash con el md5
// Other algorithms: 'sha1', 'md5', 'sha256', 'sha512' ...depends on availability of OpenSSL on platform
//VER: https://gist.github.com/GuillermoPena/9233069
function fileHash(filename, algorithm = 'md5') {
	return new Promise((resolve, reject) => {
		let shasum = crypto.createHash(algorithm);
		try {
			let s = fs.ReadStream(filename);
			s.on('data', function (data) { shasum.update(data) })
			s.on('end', function () {
				var hash = shasum.digest('hex')
				return resolve(hash);
			});
		} catch (error) { return reject('calc fail'); }
	});
}

function leerContenidoCarpeta(ruta, omitirNombre) { //U: devuelve los nombres de archivos y carpeta que contienen una ruta
	var r = new Array();
	if (ruta && fs.existsSync(ruta)){
		fs.readdirSync(ruta).forEach(item => {
			item = item || [];
			if (!omitirNombre || (item != omitirNombre)) {
				r.push(item);
			}
		});
	}
	return r;
}

//U: guarda en rutaPfxSeguro/nombreSeguro varios archivos que llegan como parte de un post
function guardarArchivos(kvArchivos, rutaPfxSeguro, logPfx, cb){
	var hashPendingCnt= Object.keys(kvArchivos).length;
	var hashes= {};
	Object.values(kvArchivos).map(archivo => { 
		//A : el tamaño maximo se controla con CfgUploadSzMax	
		var nameOk = limpiarFname(archivo.name, ".dat"); //A: ruta carpeta limpia path (que no tenga .. exe js )
		var rutaArchivo = _path.join(rutaPfxSeguro, nameOk);

		archivo.mv( rutaArchivo, err => {
			//A: mostrar hash del archivo
			fileHash(rutaArchivo).then((hash) => { 
				hashPendingCnt--; //A: me falta uno menos	
				console.log((logPfx || "Guardar ") + "upload: " + rutaArchivo + " sz: " + archivo.size + " hash: " + hash);
				hashes[archivo.name]= hash;
				if (hashPendingCnt==0) { cb(hashes) } //A: si termine, llamo el cb con los hashes
			})
		})
	});	
}

//--------------------------------------------------------------------
//S: inicializar app express
app = express();
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type'); // Request headers you wish to allow
    next(); // Pass to next layer of middleware
});
//A: le decimos a los browsers que aceptamos requests de cualquier origen, asi una pagina bajada de x.com puede acceder a nuestra api en y.com

app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({
	abortOnLimit: true,
	responseOnLimit: "ERROR: Size Max " + CfgUploadSzMax,
	limits: { fileSize: CfgUploadSzMax },
}));
//A: accedemos a parametros de posts y uploads, con tamaño maximo controlado
//A: configuramos middleware de servidor web express, y defaults

//VER: http://expressjs.com/en/starter/static-files.html
app.use('/ui', express.static(__dirname + '/../ui'));
app.use('/app', express.static(__dirname + '/../app'));
app.use('/node_modules', express.static(__dirname + '/../../node_modules'));

//U: si no pidio /api que entre a la Single Page App de la UI
app.get('/', function(req, res) { res.redirect('/ui/'); });
//SEE: http://expressjs.com/en/starter/basic-routing.html


//------------------------------------------------------------
//S: API estandar, todos los proyectos

//U: conseguir todos los nombres de missiones de un protocolo especifico
//curl "http://localhost:8888/api/missions" no existe carpeta missions
//curl "http://localhost:8888/api/missions/noExisto"  no existe protocolos
//curl "http://localhost:8888/api/missions"
app.get('/api/missions', (req, res) => {
	var ruta = rutaCarpeta(CfgDbBaseDir, req.params.protocolId, null, null, false);
	if (ruta) ruta = _path.join(ruta, "missions");
	if (!ruta) res.status(400).send('not file or directory');
	var nombreMisiones = leerContenidoCarpeta(ruta, null);
	res.status(200).send(nombreMisiones);
})

//U: se devuelven todas las misiones de todos los protocolos 
app.get('/api/missionsTODO:', (req, res) => {
	r = leerMisiones(CfgDbBaseDir);
	res.send (r)
});


//U: se devuelven todos los nombres de archivos de una mision
app.get('/api/mission/:missionId', (req, res) => {
	var ruta = rutaCarpeta(CfgDbBaseDir, req.params.protocolId, req.params.missionId, null, false);
	
	if (!ruta) res.status(400).send('not file or directory');
	else{
		var nombreArchivos = leerContenidoCarpeta(ruta);
		res.status(200).send(nombreArchivos);
	}
})

//U: se devuelve un archivo de una mision
app.get('/api/mission/:missionId/:file', (req, res) => {
	var protocoloId = req.params.protocolId;
	var missionId = req.params.missionId;
	var file  = req.params.file;

	var ruta = rutaCarpeta(CfgDbBaseDir, protocoloId, missionId, file, false);
	if (fs.existsSync(ruta)){
		res.set('fileName', req.params.file);	
		res.status(200).sendFile(_path.resolve(ruta));
	}else{
		res.send("not file or directory");
	}
})

//U: nos envian via POST uno o varios archivos de una mission
//U: curl -F 'file=@package.json' http://localhost:8888/api/mission/xtestUpload
//U: curl -F 'file=@package.json' -F 'file2=@README.md' http://localhost:8888/api/mission/xtestUpload ; echo ; for i in package.json README.md ; do if cmp DATA/missions/xtestUpload/$i $i ; then echo "OK $i"; fi; done
app.post('/api/mission/:missionId', (req, res) => {	
	if (!req.files) {  return res.status(400); } 
	//A: sino me mandaron nigun file devolvi 400

	var missionId= req.params.missionId;
	var ruta= rutaCarpeta(CfgDbMissionResultsBaseDir, missionId, null, null, true);
	guardarArchivos(req.files, ruta, "Mission files ", function(vectorHashes){
		return res.status(200).send({'status': 'ok', 'hashes': vectorHashes}); //A: envio tambien HASH
	})
});

//U: nos envian bytes de informacion, la ruta y el offset para guardar en un archivo 
app.post('/api/mission/:missionId/fileChunk', (req, res) => {
	var ruta = req.body.ruta;
	ruta = _path.join(process.cwd(), ruta); //TODO:SEC

	offset = parseInt( req.body.offset );
	informacion = req.body.informacion;
	buffer = new Buffer.from(informacion);

	fsExtra.ensureFile(ruta, err => {// A: file has now been created, including the directory it is to be placed in
		if (err) console.log(err) // => null
		
		fs.open(ruta, 'r+', function(err, fd) {
			if (err) { throw 'error opening file: ' + err; }
			else {
				fs.write(fd, buffer, 0, buffer.length, offset, function(err, bytesWritten) {
					if (err) res.send({ ok: false, err: err })
					else {
						fs.close(fd, () => {
							res.send({
								ok: true,
								ruta: ruta,
								bytesSend: buffer.length,
								bytesWritten: bytesWritten
							});
						})
					}
				});
			}
		});
	})
});

//------------------------------------------------------------
//S: protocols

//U: devuelve todos los protocolos existentes
//curl "http://localhost:8888/api/protocols"
app.get('/api/protocols', (req, res) => {
	leerJsonProtocols(CfgDbBaseDir, data => res.send(data) ); //A: devuelve un kv con el index.json de cada protocolo
});

//U: devuelve los nombres de todos los archivos dentro de un protocolo
//curl "http://localhost:8888/api/protocols/revisarFiltros"
//curl "http://localhost:8888/api/protocols/protocoloVacio" protocolo vacio
app.get('/api/protocol/:protocolId', (req, res) => {
	var protocolId = req.params.protocolId;
	var rutaMision = rutaCarpeta(CfgDbBaseDir, protocolId, null, null, false);
	if (rutaMision == null){
		res.status(404).send("protocol "+ protocolId+" does not exists");
	}else{
		res.set('protocolId', protocolId);	
		res.send(leerContenidoCarpeta(rutaMision, 'missions')); //A: la carpeta mission no la consideramos como archivos
	}
});

//U: mediante GET se pide un archivo especifico de un protocolo especifico
//curl "http://localhost:8888/api/protocols/chekearFiltros/sample.txt"
app.get('/api/protocol/:protocolId/:file', (req, res) => {	
	var rutaArchivo = rutaCarpeta(CfgDbBaseDir, req.params.protocolId, null, req.params.file, false);
	if (fs.existsSync(rutaArchivo)){
		console.log("ruta creada:  ", rutaArchivo);	
		console.log("archivo pedido: ", req.params.file);
		res.set('fileName', req.params.file);	

		let reqPath = `${process.cwd()}/${rutaArchivo}`
		console.log("ruta final:  ", reqPath);
		res.status(200).sendFile(reqPath); //res.sendfile considera "../" como corrupto
		//O: res.status(200).sendFile(path.resolve(rutaArchivo)); //res.sendfile considera "../" como corrupto
	}else{
		res.status(404).send("no file or Mission");
	}
});


//-----------------------------------------------------------------------------------
//U: listen for requests 
var listener = app.listen(process.env.PORT || CfgPortDflt, function() {
	var if2addr= net_interfaces();
	var k;
	for (k in if2addr) {
		var url = 'http://'+if2addr[k]+':'+listener.address().port;
	 	console.log(k+' : '+ url);
	}
	if (process.env.BROWSER!="NO") { open(url); } //A: lanzamos el browser por defecto
});
