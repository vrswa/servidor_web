//INFO: servidor estandar para demos y clientes simples

//OjO! cuidar seguridad, limpiar SIEMPRE nombres de archivo y solo dejar subir extensiones SEGURAS, sin ".." ni barras ni caracteres que no sean a-zA-Z0-9_ en el nombre
//OjO! cuidar tamaño maximo en uploads
//OjO! nunca poner nombres ni datos de clientes

//TODO: funciones asincronas name_a
//TODO: validar y formatear json recibido?
//TODO: algun tipo de token, no pisar archivos a lo bestia ...

//----------------------------------------------------------
//S: dependencias
var express= require('express');
var bodyParser= require('body-parser');
var os= require('os'); //A: para interfases
var fs= require('fs');
var fileUpload= require('express-fileupload');
var _path= require('path');
var crypto= require('crypto');
var fsExtra= require('fs-extra');
var shell= require('shelljs');
var open= require('open');
var basicAuth= require('express-basic-auth');

//----------------------------------------------------------
//S: config

CfgPortDflt= 8888; //U: el puerto donde escuchamos si no nos pasan PORT en el ambiente
CfgDbBaseDir= 'DATA'; //U: los datos se guardar aqui
CfgDbMissionResultsBaseDir= CfgDbBaseDir + '/missions'; //U: resultados de misiones que recibimos
CfgMissionDemoPath= _path.join(__dirname, '../../tpl/missions/xdemo');
CfgUploadSzMax= 50 * 1024 * 1024; //U: 50MB max file(s) size 

CfgIsSmartWorkArNonce= "LaRealidadSeraAumentadaONoSera"; //U: un secreto compartido con el cliente para identificar el servidor

CfgUsers={ //U: los usuarios y contraseñas que dejamos pasar
	'admin':'secret',//U: el usuario real que hace la demo 
	'rwdev':'devpwd' //U: el dispositivo cuando sube los archivos
};


//------------------------------------------------------------------
//S: util

var verificarBasic=  basicAuth({ //U: funcion middleware estandar para autenticar
	users: CfgUsers, 
	unauthorizedResponse: 'error'
	}
);

function isValidAuthToken(token) { //U: valida un token generado con genToken en el cliente
	if ( typeof(token) != 'string' || token.length < 4) return null; //A: token invalido

	var salt= token.substr(0,4); //A: nos la manda al principio del token
	var usuarioOK= Object.entries(CfgUsers).find( userYpass => {
		var tokenDeberiaSer= salt+stringHash(salt + userYpass[0] + userYpass[1]);
		//DBG: console.log("isValidAuthToken comparo : token " , token , " tokenDeberiaSer: " , tokenDeberiaSer);
		return tokenDeberiaSer == token; //A: Si el que nos mandaron con la salt hashea igual que el que tenemos guardado OK
	})
	return usuarioOK; //A: undefined o el usuario que coincide
}

//TODO: usar token como en https://stackoverflow.com/a/42280739  en especial para los mp4 etc
var verificarAuth= function (req, res, next) { //U: como autenticamos y autorizamos
	var path= req.path;
	var token= req.query.tk; //U: aceptamos un hash = token en la url ejemplo para mp4
	console.log("verificarAuth path " + path + " token " + token);
	if ( isValidAuthToken(token) ) { next(); } //A: nos paso un token valido en la url, lo dejamos seguir //TODO: revisar token en un funcion salt + hash
	else { //A: no nos paso token valido revisamos Header 
		console.log("verificarAuth path " + path + " hdr Authorization " + req.header('Authorization'));
		verificarBasic(req,res,next); 
	} 
}; 

function ser(o) { return JSON.stringify(o) }

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


function leerJsonProtocols(ruta, cb) { //U: devuelve un kv protocolo=carpeta -> contenido index.json, para cada carpeta en la ruta
	var r= {};
	fs.readdir(ruta, function(err, carpetas) { //SEC:FS:READ
		if (err) cb({ERROR: 'reading folders'})
		else{
			carpetas= carpetas || []; //A: puede no venir ninguna
			carpetas.forEach(protocolo => {
				var path = rutaCarpeta(ruta, protocolo, null, 'index.json', false);
				var data = fs.existsSync(path) ? leerJson(path) : {}; //SEC:FS:READ
				r[protocolo]= data;
			});
			cb(r)
		}
	})
}

function leerJson(ruta){
	return JSON.parse(fs.readFileSync(ruta)); //SEC:FS:READ
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

	if (!fs.existsSync(rutaCarpeta)) { //SEC:FS:READ
		if (wantsCreate) { fs.mkdirSync(rutaCarpeta, {recursive: true}); } //SEC:FS:WRITE
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

//U: hash para un string
// Other algorithms: 'sha1', 'md5', 'sha256', 'sha512' ...depends on availability of OpenSSL on platform
//VER: https://gist.github.com/GuillermoPena/9233069
function stringHash(string, algorithm = 'sha256') {
	let shasum = crypto.createHash(algorithm);
	shasum.update(string)
	var hash = shasum.digest('hex')
	return hash;
}

//U: recibe la ruta de un archivo y devuelve un hash con el sha256
// Other algorithms: 'sha1', 'md5', 'sha256', 'sha512' ...depends on availability of OpenSSL on platform
//VER: https://gist.github.com/GuillermoPena/9233069
function fileHash(filename, algorithm = 'sha256') {
	return new Promise((resolve, reject) => {
		let shasum = crypto.createHash(algorithm);
		try {
			let s = fs.ReadStream(filename); //SEC:FS:READ
			s.on('data', function (data) { shasum.update(data) })
			s.on('end', function () {
				var hash = shasum.digest('hex')
				return resolve(hash);
			});
		} catch (error) { return reject('calc fail'); }
	});
}

function leerContenidoCarpeta(ruta, omitirCarpetas, omitirArchivos) { //U: devuelve los nombres de archivos y carpeta que contienen una ruta
	var r = new Array();
	if (ruta && fs.existsSync(ruta)){//SEC:FS:READ
		fs.readdirSync(ruta).forEach(item => { //SEC:FS:READ
			item = item || [];
			rutaCompleta = `${ruta}/${item}`
		
			if ((!omitirCarpetas || !fs.lstatSync(rutaCompleta).isDirectory()) && (!omitirArchivos || !fs.lstatSync(rutaCompleta).isFile())){
				r.push(item)
			}
			
		});
	}
	return r;
}

function filesAndHash(ruta, cb){//U: me devuelve todos los archivos y hashes de una ruta
	var r = new Array();
	if (ruta && fs.existsSync(ruta)){
		listaArchivos =  fs.readdirSync(ruta); //SEC:FS:READ
		hashPendingCnt = listaArchivos.length;
		//A: tengo una array con todos los archivos y CARPETAS dentro de ruta

		for (let index = 0; index < listaArchivos.length; index++) {
			rutaArchivo =  `${ruta}/${listaArchivos[index]}`;
			console.log("rutaArchivo: " , rutaArchivo);
			obtenerHashArchivo(rutaArchivo, (err, hash) => {
				hashPendingCnt--; //A: me falta uno menos
				
				if (err) r.push({file: listaArchivos[index],hash: 'error'})
				else					
					r.push({file: listaArchivos[index],hash: hash});
				
				if (hashPendingCnt==0) { cb(r) } //A: si termine, llamo el cb con los hashes
			})
		}
	}
}

//U: guarda en rutaPfxSeguro/nombreSeguro varios archivos que llegan como parte de un post
function guardarArchivos(kvArchivos, rutaPfxSeguro, logPfx, cb){
	var hashPendingCnt= Object.keys(kvArchivos).length;
	var hashes= {};
	Object.values(kvArchivos).map(archivo => { 
		//A : el tamaño maximo se controla con CfgUploadSzMax	
		var nameOk = limpiarFname(archivo.name, ".dat"); //A: ruta carpeta limpia path (que no tenga .. exe js )
		var rutaArchivo = _path.join(rutaPfxSeguro, nameOk);

		archivo.mv( rutaArchivo, err => { //SEC:FS:WRITE
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

function listaNombresDeMisiones(){//U: devuelve un array con los nombres de todas las misiones
	return leerContenidoCarpeta( CfgDbMissionResultsBaseDir,false,true)
	//A: quiero solo las carpetas
} 

function obtenerHashArchivo(ruta, cb) {//U: recibe una ruta y un call back, devuelve el hash de un archivo 
	if (!fs.existsSync(ruta) || fs.lstatSync(ruta).isDirectory()) { //SEC:FS:READ
		//A: archivo no existe o es una carpeta
		console.log("ruta: ", ruta, " No existe")
		return cb("not file or directory",null);
	}
	
	fileHash(ruta).then((hash) => { 
		console.log("get file hash, ruta: " + ruta +" hash: " + hash);
		cb (null,hash)
		//A:  no se manda error en callback		
	})
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


//S: funciones comunes para express
function returnNotFound(res){
	res.status(404).send("not found");
}


//VER: http://expressjs.com/en/starter/static-files.html
app.use('/ui', express.static(__dirname + '/../ui'));
app.use('/app', express.static(__dirname + '/../app'));
app.use('/node_modules', express.static(__dirname + '/../../node_modules'));

//U: si no pidio /api que entre a la Single Page App de la UI
app.get('/', function(req, res) { res.redirect('/ui/'); });
//SEE: http://expressjs.com/en/starter/basic-routing.html


//------------------------------------------------------------
//S: API estandar, todos los proyectos

//U: responder para cuando cliente busca servidor escaneando la red
//TEST: H=`curl 'http://localhost:8888/api/isSmartWorkAR?nonce=MiSecretoComoCliente1'`; if [ "$H" == "bc86f7dfe95687c6faf5a632b790c458" ] ; then echo "OK" ; fi
//TEST: H=`curl 'http://localhost:8888/api/isSmartWorkAR?nonce=MiSecretoComoCliente2'`; if [ "$H" == "98b2a107561e8d5cdfd997efdc599268" ] ; then echo "OK" ; fi
app.get('/api/isSmartWorkAR', verificarAuth,  (req, res) => {
	var clientNonce= req.query.nonce || 'thisMayBeASecret'; //A: el cliente manda un texto al azar
	console.log('Scan isSmartWorkAR nonce: '+clientNonce);
	var hash= stringHash(clientNonce + '\t' + CfgIsSmartWorkArNonce); 
	res.status(200).send(hash);
	//A: devolvemos un hash unico mezclando el nonce del cliente (al azar) Y el compartido
	//asi el cliente puede validar que el servidor es el que busca hashando lo mismo y comparando
	//TODO: agregar salt al hash
})


//U: conseguir todos los nombres de missiones de un protocolo especifico
//curl "http://localhost:8888/api/missions" no existe carpeta missions
//curl "http://localhost:8888/api/missions/noExisto"  no existe protocolos
//curl "http://localhost:8888/api/missions"
app.get('/api/missions', verificarAuth,  (req, res) => {
	var ruta = rutaCarpeta(CfgDbBaseDir, req.params.protocolId, null, null, false);
	if (ruta) ruta = _path.join(ruta, "missions");
	if (!ruta) return res.status(400).send('not file or directory');
	var nombreMisiones = leerContenidoCarpeta(ruta, false,true);
	//A: tengo solo nombre de carpetas
	res.status(200).send(nombreMisiones);
})

//U: se devuelven todas las misiones en DATA/missions
app.get('/api/missions', verificarAuth, (req, res) => {
	res.send ( listaNombresDeMisiones() )
});

//U: se devuelven todos los nombres de archivos con sus hashes de una mision
app.get('/api/mission/:missionId', (req, res) => { 
	var ruta = rutaCarpeta(CfgDbMissionResultsBaseDir, req.params.missionId, null, null, false);
	if (!ruta) res.status(400).send('Not such file or directory');
	else{
		filesAndHash(ruta, (err, arrayFiles) =>{
			if (err) return res.send (err)
			res.send(arrayFiles)
		})
	}
})

//U: se devuelve un archivo de una mision
//curl --user admin:supersecret http://localhost:8888/api/mission/xdemo/index.json
app.get('/api/mission/:missionId/:file', verificarAuth, (req, res) => {
	var missionId = req.params.missionId;
	var file  = req.params.file;
	var ruta = rutaCarpeta(CfgDbMissionResultsBaseDir, missionId, null, file, false);

	console.log("Mission file "+ser({missionId, file, ruta}));

	if (fs.existsSync(ruta)){ //SEC:FS:READ
		res.set('fileName', req.params.file);	
		res.status(200).sendFile(_path.resolve(ruta));
	}else{ res.status(404).send("Not such file or directory"); }
});

app.get('/api/mission/:missionId/:file/hash', verificarAuth, (req,res)=>{ //U: devuelve el hash de un archivo en un mision
	var missionId = req.params.missionId;
	var file  = req.params.file;
	var ruta = rutaCarpeta(CfgDbMissionResultsBaseDir, missionId, null, file, false);
	//A: tengo ruta segura

	obtenerHashArchivo(ruta, (err, hash) => {
		if (err) return res.status(500).send(err);
		res.send(hash);
	})
});
//TEST: http://localhost:8888/api/mission/prueba/prueb.pdf/hash
/**
 * DATA/missions/misionName/files
 * 1-carpeta DATA, no existe. 					 return "not file or directory"
 * 2-carpeta missions, no existe. 				 return "not file or directory"
 * 3-carpeta prueba(nombre mision), no existe.   return "not file or directory"
 * 3-archivo , no existe                         return "not file or directory"
 * 4-archivo y carpetas existe                   return e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
 * 
 * http://localhost:8888/api/mission/prueba/soyUnaCarpeta/hash
 * 5-pido hash de una carpeta                    return "not such file or directory"
 * 6-diferentes tipos de archivos (jpg,png,mp4(50mb),mp4(421mb),pdf) return hashes para todos
 */

//U: nos envian via POST uno o varios archivos de una mission
//U: curl -F 'file=@package.json' http://localhost:8888/api/mission/xtestUpload
//U: curl -F 'file=@package.json' -F 'file2=@README.md' http://localhost:8888/api/mission/xtestUpload ; echo ; for i in package.json README.md ; do if cmp DATA/missions/xtestUpload/$i $i ; then echo "OK $i"; fi; done
app.post('/api/mission/:missionId', verificarAuth, (req, res) => {	
	if (!req.files) {  return res.status(400); } 
	//A: sino me mandaron nigun file devolvi 400

	var missionId= req.params.missionId;
	var ruta= rutaCarpeta(CfgDbMissionResultsBaseDir, missionId, null, null, true);
	guardarArchivos(req.files, ruta, "Mission files ", function(kvHashes){
		return res.status(200).send({'status': 'ok', 'hashes': kvHashes}); //A: envio tambien HASH
	})
});

//U: nos envian bytes de informacion, la ruta y el offset para guardar en un archivo 
app.post('/api/mission/:missionId/:fname/chunk', verificarAuth, (req, res) => {
	var missionId= req.params.missionId;
	var fname= req.params.fname;
	var ruta= rutaCarpeta(CfgDbMissionResultsBaseDir, missionId, null, fname, true);
	//A: cree las carpetas
	
	var offset= parseInt( req.body.offset );
	var buffer= req.files.data.data; //A: buffer SEE: https://www.npmjs.com/package/express-fileupload

	fsExtra.ensureFile(ruta, err => {// A: file has now been created, including the directory it is to be placed in  //SEC:FS:WRITE
		if (err) { console.error("Mision Upload Chunk", err); res.status(500).send({error: 'creating file'}) } 
		else {
			fs.open(ruta, 'r+', function(err, fd) { //SEC:FS:READ
				if (err) { console.error("Mision Upload Chunk append", err); res.status(500).send({error: 'appending to file'}) } 
				else {
					fs.write(fd, buffer, 0, buffer.length, offset, function(err, bytesWritten) { //SEC:FS:write
						if (err) { console.error("Mision Upload Chunk write", err); res.status(500).send({ error: err }) }
						else { fs.close(fd, () => { res.send({ bytesReceived: buffer.length, bytesWritten: bytesWritten }); }) }
					});
				}
			});
		}
	})
});

//U: reiniciar una mision al estado default
app.get('/api/demo/mission/:missionId/reset', verificarAuth, (req, res) => {	
	var missionId= req.params.missionId;
	var ruta= rutaCarpeta(CfgDbMissionResultsBaseDir, missionId, null, null, true);
	//SEE: https://www.npmjs.com/package/shelljs
	shell.rm('-rf', ruta);
	shell.cp('-R', CfgMissionDemoPath, ruta);
	res.send("OK");
});

//------------------------------------------------------------
//S: protocols

//U: devuelve todos los protocolos existentes
//curl "http://localhost:8888/api/protocols"
app.get('/api/protocols', verificarAuth, (req, res) => {
	leerJsonProtocols(CfgDbBaseDir, data => res.send(data) ); //A: devuelve un kv con el index.json de cada protocolo
});

//U: devuelve los nombres de todos los archivos dentro de un protocolo
//curl "http://localhost:8888/api/protocols/revisarFiltros"
//curl "http://localhost:8888/api/protocols/protocoloVacio" protocolo vacio
app.get('/api/protocol/:protocolId', verificarAuth, (req, res) => {
	var protocolId = req.params.protocolId;
	var rutaMision = rutaCarpeta(CfgDbBaseDir, protocolId, null, null, false);
	if (rutaMision == null){
		res.status(404).send("protocol "+ protocolId+" does not exists");
	}else{
		res.set('protocolId', protocolId);	
		res.send(leerContenidoCarpeta(rutaMision, false,false));
		//A: devuelvo carpetas y archivos dentro de protocolos
	}
});

//U: mediante GET se pide un archivo especifico de un protocolo especifico
//curl "http://localhost:8888/api/protocols/chekearFiltros/sample.txt"
app.get('/api/protocol/:protocolId/:file', verificarAuth, (req, res) => {	
	var rutaArchivo = rutaCarpeta(CfgDbBaseDir, req.params.protocolId, null, req.params.file, false);
	if (fs.existsSync(rutaArchivo)){ //SEC:FS:READ
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
