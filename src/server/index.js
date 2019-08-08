CfgPortDflt= 8888; //U: el puerto donde escuchamos si no nos pasan PORT en el ambiente
CfgDbBaseDir = 'TGN/protocols'; //A: los protocolos se encuentran aqui
CfgUploadSzMax = 50 * 1024 * 1024; //A: 50MB max file(s) size 

//----------------------------------------------------------
var express = require('express');
var bodyParser = require('body-parser');
var os = require('os'); //A: para interfases
var fs = require('fs');
var fileUpload = require('express-fileupload');
var path = require('path');
var crypto = require('crypto');
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
//U: devuelve los nombres de archivos y carpeta que contienen una ruta
function todosLosNombresDeArchivos (ruta){
	var r = new Array();
	if (ruta && fs.existsSync(ruta)){
		fs.readdirSync(ruta).forEach(item => {
			item = item || [];
			r.push(item);
		});
	}
	return r;
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
		console.log("secondo folder: " ,secondfolderId);
		rutaCarpeta = `${rutaCarpeta}/missions/${secondfolderId}`;
		console.log("ruta ", rutaCarpeta);
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
//   console.log(rutaCarpeta(CfgDbBaseDir,"t_rutaCarpeta_ok",null,true))
//   console.log(rutaCarpeta(CfgDbBaseDir,"t_rutaCarpeta_ok","arch1",true))
//   console.log(rutaCarpeta(CfgDbBaseDir,"t_rutaCarpeta2_ok","arch2",true))
//   console.log(rutaCarpeta(CfgDbBaseDir,"t_rutaCarpeta2_ok","Malvado1.exe",true)) //A: no pasa exe
//   console.log(rutaCarpeta(CfgDbBaseDir,"t_rutaCarpeta2_ok","/root/passwd",true)) //A: no pasa /
//   console.log(rutaCarpeta(CfgDbBaseDir,"../../t_rutaCarpeta_dirUp_MAL","index.json",true)) //A: no pasa ../
//   console.log(rutaCarpeta(CfgDbBaseDir,"/t_rutaCarpeta_root_MAL","index.json",true)) //A: no pasa /
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
  
//--------------------------------------------------------------------
var app = express();
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

/*
//U: mediante GET se piden los index.json de todas las misiones
app.get('/api/isSmartWorkAR',(req,res) => {
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	console.log("CLIENT AT " + ip);
	return res.status(200).send("YES");
});

//nos envian via POST uno o varios archivos de una mission
//U: curl -F 'fileX=@/path/to/fileX' -F 'fileY=@/path/to/fileY' ... http://localhost/upload
//U:  curl -F 'file=@\Users\VRM\Pictures\leon.jpg' -F 'file2=@\Users\VRM\Pictures\gorila.jpg' -F 'file3=@\Users\VRM\Pictures\guepardo.jpg' -F 'file4=@\Users\VRM\Pictures\leon2.jpg' -F 'file5=@\Users\VRM\Pictures\rinoceronte.jpg' http://localhost:8080/api/mission/misionDaniel
app.post('/api/missions/:missionId',(req,res) => {	
	//console.log(JSON.stringify(req.headers))
	console.log(JSON.stringify(req.body));
	//console.log(req.files);
    
	try{ 
		if(!req.files){  return res.status(400); }
		//A: sino me mandaron nigun file devolvi 400
		var files = [];
		var fileKeys = Object.keys(req.files);

		fileKeys.forEach(function(key) {
			files.push(req.files[key]);
		});
		files.forEach(archivo => {
			var rutaArchivo = rutaCarpeta(req.params.missionId, archivo.name,true);
			//A: ruta carpeta limpia path (que no tenga .. exe js )
			//A : el tamaño maximo se controla con CfgUploadSzMax	
			archivo.mv( rutaArchivo, err => {
				if (err) { return res.send(err); }
				//A: mostrar hash del archivo
				fileHash(rutaArchivo).then((hash) => { 
					console.log("mission upload: " + rutaArchivo + " tamaño archivo: " + archivo.size + " hash archivo: " + hash);
				});
				
			});	
		});
		return res.status(200).send('OK '); //TODO: enviar tambien HASH
		
	}catch (err) {
	  res.status(500).send(err);
	}
});

//U: devuelve los nombres de todos los archivos dentro de un mision
app.get('/api/missions/:missionId',(req,res) => {
	var r = new Array();
	var rutaMision = rutaCarpeta(req.params.missionId,null,false);
	if (rutaMision == null){
		//res.sendStatus(404).send("no existe la mision");
		console.log("no hay mision");
		res.send("no existe la mision");
	}else{
		fs.readdirSync(rutaMision).forEach(file => {
			r.push(file);
		});
		res.set('missionId', req.params.missionId);	
		res.send(r);
	}
});

//U: mediante GET se pide un archivo especifico de una mision especifica
//curl "http://localhost:8888/api/mission/misionDaniel/leon.jpg"
app.get('/api/missions/:missionId/:file',(req,res) => {	
	var rutaArchivo = rutaCarpeta( CfgDbBaseDir,req.params.missionId, req.params.file,false);
	if (fs.existsSync(rutaArchivo)){
		console.log(req.params.file);
		res.set('fileName', req.params.file);	
		res.status(200).sendFile(path.resolve(rutaArchivo)); //res.sendfile consider "../" como corrupto
	}else{
		res.status(404).send("no file or Mission");
	}
});

*/
//--------------------------------------NUEVAS APIS-------------------------------------

//U: devuelve todos los protocolos existentes
//curl "http://localhost:8888/api/protocols"
app.get('/api/protocols',(req,res) => {
	var r = new Array();
  
	fs.readdir(CfgDbBaseDir, function(err, carpetas) {
		if (err) res.status(500).send('error reading folders');

		carpetas= carpetas || []; //A: puede no venir ninguna
		res.status(200).send(carpetas);
	})
})


//U: devuelve los nombres de todos los archivos dentro de un protocolo
//curl "http://localhost:8888/api/protocols/revisarFiltros"
//curl "http://localhost:8888/api/protocols/protocoloVacio" protocolo vacio
app.get('/api/protocols/:protocolId',(req,res) => {
	var protocolId = req.params.protocolId;
	var r = new Array();
	var rutaMision = rutaCarpeta(CfgDbBaseDir,protocolId,null,null,false);
	if (rutaMision == null){
		res.status(404).send("protocol "+ protocolId+" does not exists");
	}else{
		fs.readdirSync(rutaMision).forEach(file => {
			if (file != 'missions') //A: la carpeta missions no es un archivo
				r.push(file);
		});
		res.set('protocolId', protocolId);	
		res.send(r);
	}
});

//U: conseguir todos los nombres de missiones de un protocolo especifico
//curl "http://localhost:8888/api/protocols/protocoloVacio/missions" no existe carpeta missions
//curl "http://localhost:8888/api/protocols/noExisto"  no existe protocolos
//curl "http://localhost:8888/api/protocols/revisarFiltros/missions"
app.get('/api/protocols/:protocolId/missions',(req,res) => {
	console.log("hola desde nombre de misiones")
	var ruta = rutaCarpeta(CfgDbBaseDir,req.params.protocolId,null,null,false);
	if (ruta) ruta = path.join(ruta, "missions");
	
	if (!ruta) res.status(400).send('not file or directory');

	var nombreMisiones = todosLosNombresDeArchivos(ruta);
	res.status(200).send(nombreMisiones);

})


//U: mediante GET se pide un archivo especifico de un protocolo especifico
//curl "http://localhost:8888/api/protocols/chekearFiltros/sample.txt"
app.get('/api/protocols/:protocolId/:file',(req,res) => {	
	var rutaArchivo = rutaCarpeta(CfgDbBaseDir, req.params.protocolId, req.params.file,false);
	if (fs.existsSync(rutaArchivo)){
		console.log("archivo pedido: ", req.params.file);
		res.set('fileName', req.params.file);	
		res.status(200).sendFile(path.resolve(rutaArchivo)); //res.sendfile considera "../" como corrupto
	}else{
		res.status(404).send("no file or Mission");
	}
});

//U: se devuelven todas las misiones de todos los protocoles 
app.get('/api/missions',(req,res) => {
	var r = new Array();
	var carpetaProtocolos = CfgDbBaseDir; //tgn/protocols
	fs.readdirSync(carpetaProtocolos).forEach(protocolo => {
		protocolo = protocolo || [];
		var rutaProtocolo = path.join(carpetaProtocolos,protocolo);
		fs.readdirSync(rutaProtocolo).forEach(file => {
			file = file || [];
			if (file == 'missions'){ //A quiero devolver las misiones que se encuentran en la carpeta 'missions'
				var rutaProtocoloMision = path.join(rutaProtocolo,file);
				if (fs.existsSync(rutaProtocoloMision)) { //A: puede no haber misiones para un protocolo
					fs.readdirSync(rutaProtocoloMision).forEach(mision => {
						mision = mision || [];
						r.push(mision);
					});
				}
			}
		});
	});
	res.send(r);
});


//U: se devuelven todos los nombres de archivos de una mision
app.get('/api/protocols/:protocolId/missions/:missionId',(req,res) => {
	var ruta = rutaCarpeta(CfgDbBaseDir,req.params.protocolId,null,false);
	
	if (ruta){ 
		ruta = path.join(ruta, "missions");
		ruta = rutaCarpeta(ruta, req.params.missionId,null,false);
	}
	if (!ruta) res.status(400).send('not file or directory');

	var nombreArchivos = todosLosNombresDeArchivos(ruta);
	res.status(200).send(nombreArchivos);
})

//U: se devuelve un archivo de una mision
app.get('/api/protocols/:protocolId/missions/:missionId/:file',(req,res) => {
	var protocoloId = req.params.protocolId;
	var missionId = req.params.missionId;
	var file  = req.params.file;

	var ruta = rutaCarpeta(CfgDbBaseDir,protocoloId,missionId,file,false);
	console.log(ruta);
	if (fs.existsSync(ruta)){
		console.log(ruta)
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
	try{ 
		if(!req.files){  return res.status(400); }
		//A: sino me mandaron nigun file devolvi 400
		var files = [];
		var fileKeys = Object.keys(req.files);

		fileKeys.forEach(function(key) {
			files.push(req.files[key]);
		});
		files.forEach(archivo => {
			var rutaArchivo = rutaCarpeta(CfgDbBaseDir , protocolsId,missionId, archivo.name,true);
			//A: ruta carpeta limpia path (que no tenga .. exe js )
			//A : el tamaño maximo se controla con CfgUploadSzMax	
			archivo.mv( rutaArchivo, err => {
				if (err) { return res.send(err); }
				//A: mostrar hash del archivo
				fileHash(rutaArchivo).then((hash) => { 
					console.log("mission upload: " + rutaArchivo + " tamaño archivo: " + archivo.size + " hash archivo: " + hash);
				});
				
			});	
		});
		return res.status(200).send('OK '); //TODO: enviar tambien HASH
		
	}catch (err) {
	  res.status(500).send(err);
	}
});

//SEE: listen for requests :)
var listener = app.listen(process.env.PORT || CfgPortDflt, function() {
	var if2addr= net_interfaces();
	var k;
	for (k in if2addr) {
	 	console.log(k+' : '+'http://'+if2addr[k]+':'+listener.address().port);
	}
});
