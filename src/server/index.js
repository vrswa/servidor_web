//TODO : funciones asincronas name_a
//TODO: no tendria que haber nombre de cliente hardcodeado
CfgPortDflt= 8888; //U: el puerto donde escuchamos si no nos pasan PORT en el ambiente
CfgDbBaseDir = 'TGN/protocols'; //A: los protocolos se encuentran aqui
CfgBlkDataSetDir = 'BLK/dataset';
CfgBlkProtocolDir = 'BLK/protocols';
CfgUploadSzMax = 50 * 1024 * 1024; //A: 50MB max file(s) size 
CfgGithubEnabled = false;
//URL de github para actualizar los archivos de protocolos y dataset
GitProtocolDemoUrl = 'https://api.github.com/repos/vrswa/portalBLK/contents/Protocols/Demo';
GitDatasetUrl ='https://api.github.com/repos/vrswa/portalBLK/contents/DataSets';
//----------------------------------------------------------
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
function leerMisiones (rutaOrigen){
	var r = new Array();
	fs.readdirSync(rutaOrigen).forEach(protocolo => {
		protocolo = protocolo || [];
		var rutaProtocolo = _path.join(rutaOrigen,protocolo);
		fs.readdirSync(rutaProtocolo).forEach(file => {
			file = file || [];
			if (file == 'missions'){ //A quiero devolver las misiones que se encuentran en la carpeta 'missions'
				var rutaProtocoloMision = path.join(rutaProtocolo,file);
				if (fs.existsSync(rutaProtocoloMision)) { //A: puede no haber misiones para un protocolo
					fs.readdirSync(rutaProtocoloMision).forEach(mision => {
						mision = mision || [];
						ruta = rutaCarpeta(rutaProtocoloMision,mision,null,'state.json',false);
						if(fs.existsSync(ruta)){
							r.push(leerJson(ruta))
						}	
					});
				}
			}
		});
	});
	return r;
}

//VER: descarga un archivo de una url y lo guarda en un destino recibe un callback cuando finaliza
const downloadFile = (async (url, path) => {
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

//recibe una ruta y lee todos los archivos con nombre 'index.json' 
function leerJsonProtocols (ruta,callback) {
	var r = new Array();
	fs.readdir(ruta, function(err, carpetas) {
		if (err) callback (['error reading folders'])
		else{
			carpetas= carpetas || []; //A: puede no venir ninguna
			carpetas.forEach(protocolo => {
				path = rutaCarpeta(ruta,protocolo,null,'index.json',false);
				if(fs.existsSync(path)){
					r.push(leerJson(path))
				}
			});
			callback(r)
		}
	})
}

function leerJson(ruta){
	return JSON.parse(fs.readFileSync(ruta));
}

//U: limpia extensiones de archivos no aceptadas, por aceptadas
/*
limpiarFname("../../esoy un path \\Malvado.exe");
limpiarFname("TodoBien.json");
limpiarFname("TodoCasiBien.Json");
limpiarFname("Ok.mp3");
*/
function limpiarFname(fname, dfltExt) {
var fnameYext= fname.match(/(.+?)(\.(mp4|mp3|wav|png|jpg|json|txt|pdf))/) || ["",fname, dfltExt||""];
//A: o tiene una extension aceptada, o le ponemos dfltExt o ""
var fnameSinExt= fnameYext[1];
var fnameLimpio= fnameSinExt.replace(/[^a-z0-9_-]/gi,"_") + fnameYext[2];
//A: en el nombre si no es a-z A-Z 0-9 _ o - reemplazo por _ , y agrego extension aceptada
return fnameLimpio;
}

//U: devuelve la ruta a la carpeta o archivo si wantsCreate es true la crea sino null
function rutaCarpeta(rutaprevia,folderId,secondfolderId,file,wantsCreate) {
folderId = limpiarFname(folderId||"_0SinProtocolo_");
file = file!=null && limpiarFname(file,".dat");

var rutaCarpeta = `${rutaprevia}/${folderId}`;
if (secondfolderId){
	secondfolderId = limpiarFname(secondfolderId);
	rutaCarpeta = `${rutaCarpeta}/missions/${secondfolderId}`;
}
if (!fs.existsSync(rutaCarpeta)) { 
		if (wantsCreate){
		fs.mkdirSync(rutaCarpeta, {recursive: true});
			//A: crea la carpeta para la mision Y todas las que hagan falta para llegar ahi
		}else{
			return null;
		}
	}
//A:tenemos carpeta
if (file){
	var rutaArchivo = `${rutaCarpeta}/${file}`;
	return rutaArchivo;
}else{
	return rutaCarpeta;
}
}
//   TESTS
//   console.log(rutaCarpeta(CfgDbBaseDir,"mantenimientoTurbina",null,false)) //A: devuelve ruta a protocolo en especifico
//   console.log(rutaCarpeta( path.join(CfgDbBaseDir,"mantenimientoTurbina","missions"),"misionMantenimientoTurbina_1",null,false))//A: devuelve ruta  a mission especifica
//   console.log(rutaCarpeta( path.join(CfgDbBaseDir,"mantenimientoTurbina","missions"),"misionNueva",null,true))//A: crear carpeta para mision
//   console.log(rutaCarpeta( path.join(CfgDbBaseDir,"mantenimientoTurbina","missions"),"misionFalsa",null,false))//A: no crea carpeta para mision

//U: recibe la ruta de un archivo y devuelve un hash con el md5
//VER: https://gist.github.com/GuillermoPena/9233069
function fileHash(filename, algorithm = 'md5') {
	return new Promise((resolve, reject) => {
		// Algorithm depends on availability of OpenSSL on platform
		// Another algorithms: 'sha1', 'md5', 'sha256', 'sha512' ...
		let shasum = crypto.createHash(algorithm);
		try {
		let s = fs.ReadStream(filename)
		s.on('data', function (data) {
			shasum.update(data)
		})
		// making digest
		s.on('end', function () {
			const hash = shasum.digest('hex')
			return resolve(hash);
		})
		} catch (error) {
		return reject('calc fail');
		}
	});
}
function leerContidoCarpeta (ruta, omitirNombre){
	//U: devuelve los nombres de archivos y carpeta que contienen una ruta
	var r = new Array();
	if (ruta && fs.existsSync(ruta)){
		fs.readdirSync(ruta).forEach(item => {
			item = item || [];
			if (!omitirNombre){
				r.push(item);
			}else{
				if (item != omitirNombre)
					r.push(item);
			}
		});
	}
	return r;
}

function guardarArchivos(arrayArchivos,ruta,callback){
	var files = [];
	var fileKeys = Object.keys(arrayArchivos);
	var hashInfo = new Array();
	var counter = 0;
	fileKeys.forEach(function(key) {
		files.push(arrayArchivos[key]);
	});
	files.forEach(archivo => {
		archivo.name = limpiarFname(archivo.name, ".dat"); 
		var rutaArchivo = path.join(ruta,archivo.name);
		//A: ruta carpeta limpia path (que no tenga .. exe js )
		//A : el tamaño maximo se controla con CfgUploadSzMax	
		archivo.mv( rutaArchivo, err => {
			//A: mostrar hash del archivo
			fileHash(rutaArchivo).then((hash) => { 
				counter++;
				console.log("mission upload: " + rutaArchivo + " tamaño archivo: " + archivo.size + " hash archivo: " + hash);
				hashInfo.push( {[archivo.name] : hash} );
				if(counter == files.length){
					callback(hashInfo)
				}
			})
		})
	});	
}

//U: descargar los archivos desde 'url' y los guarda en 'savePath'
function githubFiles (url,savePath,callback){
	//esto me devuelve un array de json
	fetch(url)
	.catch(error => callback("error") )
	.then(res => res.json())
	.then(infoArchivos => {
			if(Array.isArray( infoArchivos)){
				savedFileCounter = 0; 
				infoArchivos.forEach( function(info){
					downloadFile(info.download_url,`${savePath}/${info.name}`).then( () => {	
							savedFileCounter ++;
							if(savedFileCounter == infoArchivos.length){	
								callback();
							}
						}
					)
				})
			}else{
				console.log("error corran!")
				callback("error")
			}
		}
	);
}

//U: actuliza dataset o protocols de github
function actualizarArchivos(DatasetUpdate,callback){
	if (!CfgGithubEnabled) callback();
	else{
		console.log("me sigo ejecutando")
		if (!DatasetUpdate){
			var savePath  = rutaCarpeta(CfgBlkProtocolDir,'demo',null,null, true); //carpeta demo puede no estar creada
			var url = GitProtocolDemoUrl;
		}
		else{
			var savePath =  rutaCarpeta('BLK','dataset',null,null,true);
			var url = GitDatasetUrl;
		}
		//A:URL tiene la ruta donde voy a grabar
		githubFiles(url,savePath,callback)
	}
}
//--------------------------------------------------------------------
var app = express();
// Add headers
//A: solution for cross origing request
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');


    // Pass to next layer of middleware
    next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({
	abortOnLimit: true,
	responseOnLimit: "ERROR: Size Max "+CfgUploadSzMax,
	limits: { 
	  fileSize: CfgUploadSzMax
	},
  }));
//A: we've started you off with Express, 

//VER: http://expressjs.com/en/starter/static-files.html
app.use('/ui', express.static(__dirname + '/../ui'));
app.use('/app', express.static(__dirname + '/../app'));
app.use('/node_modules', express.static(__dirname + '/../../node_modules'));
//app.use('/api/mision', express.static(__dirname + '/../../mision'));
//app.use(__dirname + '/../../mision');
// init sqlite db

//SEE: http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(req, res) {
		res.redirect('/ui/');
});


//--------------------------------------NUEVAS APIS-------------------------------------

//U: devuelve todos los protocolos existentes
//curl "http://localhost:8888/api/protocols"
app.get('/api/protocols',(req,res) => {
	leerJsonProtocols(CfgDbBaseDir, function(vector){
		res.send(vector)
	})
});


app.get('/api/github',(req,res) => {
	var url =  "https://raw.githubusercontent.com/vrswa/portalBLK/master/DataSets/pruebaBorrame.json";
	var url2 = "https://raw.githubusercontent.com/vrswa/portalBLK/master/Protocols/Demo/Demo.lua";
	nombre = 'prueba.json'
	//download(url,`./prueba.jsn`,() => res.send('ok') );
	downloadFile(url,`${CfgBlkDataSetDir}/pruebaBorrame.json`).then( () => res.send('salio bien?'));
}); 

//U: devuelve los nombres de todos los archivos dentro de un protocolo
//curl "http://localhost:8888/api/protocols/revisarFiltros"
//curl "http://localhost:8888/api/protocols/protocoloVacio" protocolo vacio
app.get('/api/protocols/:protocolId',(req,res) => {
	var protocolId = req.params.protocolId;
	var rutaMision = rutaCarpeta(CfgDbBaseDir,protocolId,null,null,false);
	if (rutaMision == null){
		res.status(404).send("protocol "+ protocolId+" does not exists");
	}else{
		res.set('protocolId', protocolId);	
		res.send(leerContidoCarpeta(rutaMision,'missions')); //A: la carpeta mission no la consideramos como archivos
	}
});

//U: conseguir todos los nombres de missiones de un protocolo especifico
//curl "http://localhost:8888/api/protocols/protocoloVacio/missions" no existe carpeta missions
//curl "http://localhost:8888/api/protocols/noExisto"  no existe protocolos
//curl "http://localhost:8888/api/protocols/revisarFiltros/missions"
app.get('/api/protocols/:protocolId/missions',(req,res) => {
	var ruta = rutaCarpeta(CfgDbBaseDir,req.params.protocolId,null,null,false);
	if (ruta) ruta = path.join(ruta, "missions");
	
	if (!ruta) res.status(400).send('not file or directory');

	var nombreMisiones = leerContidoCarpeta(ruta,null);
	res.status(200).send(nombreMisiones);
})


//U: mediante GET se pide un archivo especifico de un protocolo especifico
//curl "http://localhost:8888/api/protocols/chekearFiltros/sample.txt"
app.get('/api/protocols/:protocolId/:file',(req,res) => {	
	var rutaArchivo = rutaCarpeta(CfgDbBaseDir, req.params.protocolId, null,req.params.file,false);
	if (fs.existsSync(rutaArchivo)){
		console.log("archivo pedido: ", req.params.file);
		res.set('fileName', req.params.file);	
		res.status(200).sendFile(path.resolve(rutaArchivo)); //res.sendfile considera "../" como corrupto
	}else{
		res.status(404).send("no file or Mission");
	}
});

//U: se devuelven todas las misiones de todos los protocolos 
app.get('/api/missions',(req,res) => {
	r = leerMisiones(CfgDbBaseDir);
	res.send (r)
});


//U: se devuelven todos los nombres de archivos de una mision
app.get('/api/protocols/:protocolId/missions/:missionId',(req,res) => {
	var ruta = rutaCarpeta(CfgDbBaseDir,req.params.protocolId,req.params.missionId,null,false);
	
	if (!ruta) res.status(400).send('not file or directory');
	else{
		var nombreArchivos = leerContidoCarpeta(ruta);
		res.status(200).send(nombreArchivos);
	}
})

//U: se devuelve un archivo de una mision
app.get('/api/protocols/:protocolId/missions/:missionId/:file',(req,res) => {
	var protocoloId = req.params.protocolId;
	var missionId = req.params.missionId;
	var file  = req.params.file;

	var ruta = rutaCarpeta(CfgDbBaseDir,protocoloId,missionId,file,false);
	if (fs.existsSync(ruta)){
		res.set('fileName', req.params.file);	
		res.status(200).sendFile(path.resolve(ruta));
	}else{
		res.send("not file or directory");
	}
})

//nos envian via POST uno o varios archivos de una mission
//U: curl -F 'fileX=@/path/to/fileX' -F 'fileY=@/path/to/fileY' ... http://localhost/upload
//U:  curl -F 'file=@\Users\VRM\Pictures\leon.jpg' -F 'file2=@\Users\VRM\Pictures\gorila.jpg' -F 'file3=@\Users\VRM\Pictures\guepardo.jpg' -F 'file4=@\Users\VRM\Pictures\leon2.jpg' -F 'file5=@\Users\VRM\Pictures\rinoceronte.jpg' http://localhost:8888/api/protocols/protocoloNuevo/missions/misionDaniel
app.post('/api/protocols/:protocolsId/missions/:missionId',(req,res) => {	
	var protocolsId = req.params.protocolsId;
	var missionId = req.params.missionId;

	if(!req.files){  return res.status(400); }
	//A: sino me mandaron nigun file devolvi 400
	var ruta = rutaCarpeta(CfgDbBaseDir,protocolsId,missionId,null,true);
	guardarArchivos(req.files,ruta,function(vectorHashes){
		return res.status(200).send({'status': 'ok', 'hashes': vectorHashes}); //A: envio tambien HASH
	})
});

app.post('/api/protocols/:protocolsId',(req,res) => {
	//la ruta es dentro de protocols / protocoldid
	var ruta  = rutaCarpeta(CfgDbBaseDir,req.params.protocolsId,null,null,true);
	if (req.files) {
		guardarArchivos(req.files,ruta,function(vectorHashes){
			return res.status(200).send({'status': 'ok', 'hashes': vectorHashes}); //A: envio tambien HASH
		})		
	}else{
		res.send('not files')
	}
	
})

//---------------------------------------BLK APIS------------------------------------

//devuelva la lista con los nombres de archivos que estan dentro de la carpeta blk/dataset
// http://192.168.1.199:8888/api/blk/dataset
app.get('/api/blk/dataset',(req,res) => {
	try {
		actualizarArchivos(true,(err) => 
		{
			if (err){
				console.log("enviando dataset antiguo")
				res.send(leerContidoCarpeta(CfgBlkDataSetDir,'missions'))//A: la carpeta mission no la consideramos como archivos
			}else{
				console.log("enviando dataset actualizado");
				res.send(leerContidoCarpeta(CfgBlkDataSetDir,'missions'))//A: la carpeta mission no la consideramos como archivos
			}			
		}
	)
	} catch (error) {
		console.log("FALLO: ", error);
		res.send(leerContidoCarpeta(CfgBlkDataSetDir,'missions'))
	}
});

//devuelve un archivo que esta dentro de la carpeta blk/dataset
//http://192.168.1.199:8888/api/blk/dataset/prueba1.json
app.get('/api/blk/dataset/:datasetId',(req,res) => {
	datasetId = req.params.datasetId;
	var ruta = rutaCarpeta(CfgBlkDataSetDir,datasetId,null,null,false);
	if (ruta){
		let reqPath = `${process.cwd()}/${ruta}`
		console.log(reqPath);
        res.sendFile(reqPath)
	}else{
		res.send('not file in the dataset main folder')
	}
})

//devuelve un array con los JSON de todos los protocolos
// http://192.168.1.199:8888/api/blk/protocols
app.get('/api/blk/protocols',(req,res) => {
	// actualizarArchivos(false,() => 
	// 	leerJsonProtocols(CfgBlkProtocolDir, function(vector){
	// 		res.send(vector)
	// 	})
	// )
	try {
		actualizarArchivos(false,(err) => 
		{
			if (err){
				console.log("enviando dataset antiguo")
				leerJsonProtocols(CfgBlkProtocolDir, function(vector){
					res.send(vector)
				})
			}else{
				console.log("enviando dataset actualizado");
				leerJsonProtocols(CfgBlkProtocolDir, function(vector){
					res.send(vector)
				})
			}			
		}
	)
	} catch (error) {
		console.log("FALLO: ", error);
		leerJsonProtocols(CfgBlkProtocolDir, function(vector){
			res.send(vector)
		})
	}
});

//devuelve una lista con los nombres de los archivos dentro de blk/protocols/porcolID
// http://192.168.1.199:8888/api/blk/protocols/revisarFiltros
app.get('/api/blk/protocols/:protocolsId',async (req,res) => {
	var protocolId = req.params.protocolsId;
	var rutaMision = rutaCarpeta(CfgBlkProtocolDir,protocolId,null,null,false);
	if (rutaMision == null){
		res.status(404).send("protocol "+ protocolId+" does not exists");
	}else{
		res.set('protocolId', protocolId);	
		res.send(leerContidoCarpeta(rutaMision,'missions')); //A: la carpeta mission no la consideramos como archivos
	}
});

//U: mediante GET se pide un archivo especifico de un protocolo especifico
// http://192.168.1.199:8888/api/blk/protocols/revisarFiltros/engine.jpg
app.get('/api/blk/protocols/:protocolId/:file',async (req,res) => {
	var rutaArchivo = rutaCarpeta(CfgBlkProtocolDir, req.params.protocolId, null,req.params.file,false);
	
	if (fs.existsSync(rutaArchivo)){
		console.log("ruta creada:  ", rutaArchivo);
		res.set('fileName', req.params.file);
		//let reqPath = path.join(process.cwd(), rutaArchivo);
		let reqPath = `${process.cwd()}/${rutaArchivo}`
		console.log("ruta final:  ", reqPath);
		res.status(200).sendFile(reqPath); //res.sendfile considera "../" como corrupto
	}else{
		res.status(404).send("no file or Mission");
	}
});

//U: se devuelven los datos de los JSON de todas la misiones
// http://192.168.1.199:8888/api/blk/missions
app.get('/api/blk/missions',(req,res) => {
	
	r = leerMisiones(CfgBlkProtocolDir);
	res.send(r);
});

//U: se devuelve los nombres de los archivos que estan dentro de una mision
//http://192.168.1.199:8888/api/blk/protocols/revisarFiltros/missions/mission341
app.get('/api/blk/protocols/:protocolId/missions/:missionId',(req,res) => {
	var ruta = rutaCarpeta(CfgBlkProtocolDir,req.params.protocolId,req.params.missionId,null,false);
	
	if (!ruta) res.status(400).send('not file or directory');
	else{
		var nombreArchivos = leerContidoCarpeta(ruta);
		res.status(200).send(nombreArchivos);
	}
})

//nos envian via POST uno o varios archivos de una mission
app.post('/api/blk/protocols/:protocolsId/missions/:missionId',(req,res) => {	
	var protocolsId = req.params.protocolsId;
	var missionId = req.params.missionId;

	if(!req.files){  return res.status(400); }
	//A: sino me mandaron nigun file devolvi 400
	var ruta = rutaCarpeta(CfgBlkProtocolDir,protocolsId,missionId,null,true);
	guardarArchivos(req.files,ruta,function(vectorHashes){
		return res.status(200).send({'status': 'ok', 'hashes': vectorHashes}); //A: envio tambien HASH
	})
});

//se envian uno o mas archivos y se guardan en blk/protocols/:protocolsId
app.post('/api/blk/protocols/:protocolsId',(req,res) => {
	//la ruta es dentro de protocols / protocoldid
	var ruta  = rutaCarpeta(CfgDbBaseDir,req.params.protocolsId,null,null,true);
	if (req.files) {
		guardarArchivos(req.files,ruta,function(vectorHashes){
			return res.status(200).send({'status': 'ok', 'hashes': vectorHashes}); //A: envio tambien HASH
		})		
	}else{
		res.send('not files')
	}
})

app.post('/api/blk/pedazosDeInfo',(req,res) => {
	ruta = req.body.ruta;
	informacion = req.body.informacion;
	offset = parseInt( req.body.offset );
	console.log(ruta, informacion, offset)
	ruta = _path.join(__dirname, '..','..' ,ruta);
	buffer = new Buffer(informacion);

	fsExtra.ensureFile(ruta, err => {// A: file has now been created, including the directory it is to be placed in
		if (err) console.log(err) // => null
		
		fs.open(ruta, 'r+', function(err, fd) {
			if (err) {
				throw 'error opening file: ' + err;
			}
			fs.write(fd, buffer, 0, buffer.length, offset, function(err) {
				if (err) throw 'error writing file: ' + err;
				fs.close(fd, function() {
					res.send('file written');
				})
			});
		});
	})
})
 
//-----------------------------------------------------------------------------------
//SEE: listen for requests :)
var listener = app.listen(process.env.PORT || CfgPortDflt, function() {
	var if2addr= net_interfaces();
	var k;
	for (k in if2addr) {
		var url = 'http://'+if2addr[k]+':'+listener.address().port;
	 	console.log(k+' : '+ url);
	}
	//open(url);
});
