CfgPortDflt= 8888; //U: el puerto donde escuchamos si no nos pasan PORT en el ambiente
CfgDbBaseDir = 'SmartWorkAR/db/missions'; //A: las misiones que llegan se escriben aqui
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
	var fnameYext= fname.match(/(.+?)(\.(mp4|mp3|wav|png|jpg|json|txt))/) || ["",fname, dfltExt||""];
	//A: o tiene una extension aceptada, o le ponemos dfltExt o ""
	var fnameSinExt= fnameYext[1];
	var fnameLimpio= fnameSinExt.replace(/[^a-z0-9_-]/gi,"_") + fnameYext[2];
	//A: en el nombre si no es a-z A-Z 0-9 _ o - reemplazo por _ , y agrego extension aceptada
	return fnameLimpio;
  }
  
  //U: devuelve la ruta a la carpeta o archivo si wantsCreate es true la crea sino null
  function rutaCarpeta(missionId,file,wantsCreate) {
	missionId = limpiarFname(missionId||"_0SinMision_");
	file = file!=null && limpiarFname(file,".dat");
	var rutaCarpeta = `${CfgDbBaseDir}/${missionId}`;
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
  /* TESTS
  console.log(rutaCarpeta("t_rutaCarpeta_ok",null,true))
  console.log(rutaCarpeta("t_rutaCarpeta_ok","arch1",true))
  console.log(rutaCarpeta("t_rutaCarpeta2_ok","arch2",true))
  console.log(rutaCarpeta("t_rutaCarpeta2_ok","Malvado1.exe",true)) //A: no pasa exe
  console.log(rutaCarpeta("t_rutaCarpeta2_ok","/root/passwd",true)) //A: no pasa /
  console.log(rutaCarpeta("../../t_rutaCarpeta_dirUp_MAL","index.json",true)) //A: no pasa ../
  console.log(rutaCarpeta("/t_rutaCarpeta_root_MAL","index.json",true)) //A: no pasa /
  */

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


//U: mediante GET se piden los index.json de todas las misiones
app.get('/api/isSmartWorkAR',(req,res) => {
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	console.log("CLIENT AT " + ip);
	return res.status(200).send("YES");
});

//U: mediante GET se piden los index.json de todas las misiones
app.get('/api/mission',(req,res) => {
	var r = new Array();
  
	fs.readdir(CfgDbBaseDir, function(err, carpetas) {
		carpetas= carpetas || []; //A: puede no venir ninguna
	  for (var i=0; i<carpetas.length; i++) {
			var rutaArchivo = `${CfgDbBaseDir}/${carpetas[i]}/index.json`;
			if (fs.existsSync(rutaArchivo)) {
				r.push(leerJson(rutaArchivo));
			}  
			//TODO: podriamos querer devolver algo aunque no haya index? ej. subio una foto sola?
			rutaArchivo="";
		}
		return res.status(200).send(r);
	});
});

//nos envian via POST uno o varios archivos de una mission
//U: curl -F 'file=@package.json' http://localhost:8888/api/mission/carpetadeLaMision
//U: curl -F 'file=@\Users\VRM\Pictures\leon.jpg' http://localhost:8888/api/mission/misionDaniel
app.post('/api/mission/:missionId',(req,res) => {
	try{
		if(!req.files){  return res.status(400); }
		//A: sino me mandaron nigun file devolvi 400
		var archivo = req.files.file;
		var rutaArchivo = rutaCarpeta(req.params.missionId, archivo.name,true);
		//A: ruta carpeta limpia path (que no tenga .. exe js )
		//A : el tamaño maximo se controla con CfgUploadSzMax
	
		archivo.mv( rutaArchivo, err => {
			if (err) { return res.send(err); }
			
			//A: mostrar hash del archivo
			fileHash(rutaArchivo).then((hash) => { 
				console.log("mission upload: " + rutaArchivo + " tamaño archivo: " + archivo.size + " hash archivo: " + hash);
			});
			return res.status(200).send('OK ' + archivo.size); //TODO: enviar tambien HASH
		});
	}catch (err) {
	  res.status(500).send(err);
	}
});


//U: devuelve los nombres de todos los archivos dentro de un mision
app.get('/api/mission/:missionId',(req,res) => {	
	var r = new Array();
	var rutaMision = rutaCarpeta(req.params.missionId,null,false);
	if (rutaMision == null){
		res.sendStatus(404).send("no existe la mision");
	}
	fs.readdirSync(rutaMision).forEach(file => {
		r.push(file);
	});
	res.send(r);
});

//U: mediante GET se pide un archivo especifico de una mision especifica
//curl "http://localhost:8888/api/mission/misionDaniel/leon.jpg"
app.get('/api/mission/:missionId/:file',(req,res) => {	
	var rutaArchivo = rutaCarpeta( req.params.missionId, req.params.file,false);
	if (fs.existsSync(rutaArchivo)){
		res.status(200).sendFile(path.resolve(rutaArchivo)); //res.sendfile consider "../" como corrupto
	}else{
		res.status(404);
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




