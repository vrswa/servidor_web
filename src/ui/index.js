//S: server and files cfg
ServerUrl= location.href.match(/(https?:\/\/[^\/]+)/)[0]; //A: tomar protocolo, servidor y puerto de donde esta esta pagina
MissionUrl= ServerUrl+'/api/mission/xdemo';
ManifestUrl= MissionUrl+'/index.json';
ResetDemoUrl= ServerUrl+'/api/demo/mission/xdemo/reset';

//S: INSPECTION NAMES
PALLETINSPECTION= "Pallet Inspection";
I1PACKAGES= "Inspection 1";
I2STORAGE= "Inspection 2";
I3UNITS= "Inspection 3";
UNREGISTERED_ITEMS= "Unregistered items";

//colores rgb de la empresa BLK
COLORS = {
  azulOscuro: 'rgb(56,87,162)',
  azulClaro: 'rgb(105,178,226)',
}
VIDEO_ICON_URL = '/ui/imagenes/video_play.png'

//S: globales
var usuario = ''; //el nombre que se ingreso en el formulario de ingreso
var password= '';

function genToken() { //U: genera un token unico para autenticarse con el servidor
  var salt= Math.floor((Math.random() * 10000000)).toString(16).substr(0,4);
  var token= salt+CryptoJS.SHA256(salt + usuario + password).toString(); //TODO: defenir stringHash() como en el server
  return token;
}

Manifiestos= []; //U: array de Manifiestos con toda la informacion que vino en el json
ManifiestoError= "Loading manifest"; //U: mensaje de que error hubo cargando o null, DFLT
ManifiestoElegido= null; //U: kv con los datos del seleccionado en el desplegable principal
manifiestoID= 'not selected';

var listaGuiaDeEmbarque;
var guiaID;
var InspeccionElegida;   //U: conserva el evento seleccionado
var ArchivosInspeccionElegida = ''; //U: lista de archivos para mostrar en uiGallerry

/************************************************************************** */

var Estilos= "cerulean chubby cosmo cyborg darkly flatly journal lumen paper readable sandstone simplex slate solar spacelab superhero united yeti".split(' ');

function setTheme(t) {
  var st= document.getElementById("tema");
  st.href='/node_modules/semantic-ui-forest-themes/semantic.'+t+'.min.css';
}

function JSONtoDATE(JSONdate) {  //U: recibe una fecha en formato json y devuelve un string con la fecha dia/mes/anio
	let fecha = new Date(JSONdate);
	if (isNaN(fecha)) return 'error en fecha'
	return  [fecha.getDate(), fecha.getMonth()+1, fecha.getFullYear()].map(n => (n+'').padStart(2,"0")).join("/");
	//A: ojo, Enero es el mes CERO para getMonth
}

function JSONtoHour(JSONdate) {
	let date = new Date(JSONdate);
	return [date.getHours(), date.getMinutes()].map(n => (n+'').padStart(2,"0")).join(":");
}             

async function resetDemo() { //U: borra el directorio con datos y lo vuelve al estado inicial
  var res = await fetch(ResetDemoUrl,{
    headers: new Headers({
      'Authorization': 'Basic '+btoa(`${usuario}:${password}`), //TODO: encapsular fetch en una funcion "conseguirDelServidor" con autenticacion, usar un metodo que no mande la misma todas las veces y tampoco sin ecnriptar
      'Content-Type': 'application/x-www-form-urlencoded'
    }), 
  });
	alert("La demo ha vuelto al estado inicial");
	window.location.href='/';		
}

async function obtenerManifiesto() {   //U: funcion que obtiene los nombre de los dataset disponibles
  ManifiestoError= "Loading manifest"; //DFLT
  
  var res = await fetch(ManifestUrl,{
    headers: new Headers({
      'Authorization': 'Basic '+btoa(`${usuario}:${password}`), //TODO: encapsular fetch en una funcion "conseguirDelServidor" con autenticacion, usar un metodo que no mande la misma todas las veces y tampoco sin ecnriptar
      'Content-Type': 'application/x-www-form-urlencoded'
    }), 
  });
  //A: pedi la informacion con mis credenciales
  console.log("codigo peticion: " + res.status);
  if(res.status == 401){ ManifiestoError= "User or Password incorrect TRY LOG IN AGAIN"; console.error("Manifests", ManifiestoError); }
  else if(res.status == 404){ ManifiestoError= "No manifests found (404)"; console.error("Manifests", ManifiestoError); } 
	else{
		try {
			Manifiestos = [await res.json()];
			console.log("Manifests", Manifiestos)
			ManifiestoElegido= buscarManifiesto(Manifiestos);
			if (ManifiestoElegido!= null) {
				ManifiestoError= null;
				if (! Array.isArray(ManifiestoElegido.guides)) { ManifiestoElegido.guides= []; }	
				ManifiestoElegido.guides.forEach( g => {
					if (! Array.isArray(g.history)) { g.history= []; }	
					if (! Array.isArray(g.items)) { g.items= []; }	
					g.items.forEach( it => {
						if (! Array.isArray(it.history)) { it.history= []; }	
					});
				});
			}
		} catch (error) {
			console.error("Manifests", ManifiestoError);
			ManifiestoError= error || "Reading manifests";
		}      
	}    
}

function buscarGuia(guiaId) { //U: buscar una guia con su ID dentro del ManifiestoElegido
	var listaGuias = ManifiestoElegido.guides;
	//A: tengo array de kv que tiene c/u informacion de UNA guias
	for (let index = 0; index < listaGuias.length; index++) {
			if( listaGuias[index].id == guiaId) {
				return listaGuias[index]
			}
	}
}

function buscarManifiesto(manifiestos, id){
	if (id==null) return manifiestos[0]; //A: si no me piden id, el primero que encuentre

	for (let i= 0; i < manifiestos.length; i++) {
		if (manifiestos[i].id == id) return manifiestos[i];
	}
	return null;
}



//------------------------------------------------------------
uiLogin = MkUiComponent (function uiLogin(my){ //U: formulario de ingreso 
  my.componentWillMount = function () {
    var body = document.getElementsByTagName('body')[0];
    body.style.backgroundColor = 'rgb(49, 84, 165)';
  }

  tecleando = (e, { name, value }) => my.setState({[name]: value});
  enviarFormulario = () => {
    
    usuario= my.state.nombre.trim();
    password= my.state.password.trim();

    if(usuario !='' && usuario != null & usuario != undefined){
      if(my.state.password !='' && my.state.password != null & my.state.password != undefined)
      preactRouter.route("/menu")
    }
  }

  my.render = function(){
    return (
      h(Grid,{textAlign:'center', style:{ height: '100vh' }, verticalAlign:'middle'},
        h(Grid.Column, {style: {maxWidth: 450}},
          h(Image,{src:'./imagenes/blk.png'},), 
          h(Form,{size:'large',onSubmit: enviarFormulario },
            h(Segment,{stacked:true},
              h(Form.Input,{name: 'nombre',onChange: tecleando , fluid:true, icon:'user', iconPosition:'left', placeholder:'E-mail address',value: my.state.nombre}),
              h(Form.Input,{name: 'password', onChange: tecleando,fluid:true, icon:'lock',iconPosition:'left',placeholder:'Password',type:'password',value: my.state.password}),
              h(Button,{color:'blue', fluid:true,size:'large'},"Login")  //onClick: () =>preactRouter.route("/menu")
            )
          )  
        )
      )
    )
  }
});

//------------------------------------------------------------
uiMenuTopbar= MkUiComponent(function uiMenuTopbar(my) {//U: menu principal de la parte superior 
  my.render= function (props, state) {
    return (
      h(Menu,{item:true,stackable:true,style:{backgroundColor: 'rgb(255, 255, 255)'}},
        h('img',{src: './imagenes/logoBlanco.png',style:{width:"180px",height:'60px',"margin-top":"3px"}}),
        
        h(Menu.Menu,{position:'right'},
          h(Menu.Item,{},
            h(Icon,{name:'user',size:'big',style:{'color': COLORS.azulOscuro}}),
            h('p',{style:{'color': COLORS.azulOscuro}}, `Welcome ${usuario ? usuario : ''}`,)
            
          ),
          h(Menu.Item,{},
            
            h(Button, {onClick: resetDemo, style:{'background-color': '#600000','color':'rgb(255,255,255)', marginRight: '5px'}},"reset" ),

            h(Button, {onClick: () =>preactRouter.route("/"), style:{'background-color': COLORS.azulClaro,'color':'rgb(255,255,255)'}},"Log Out" ),

            h(Button, {icon: true,labelPosition:'left',onClick: props.onRefresh, color: 'green',style:{ 'margin-left': '15px'}},
              h(Icon,{name:'refresh'}),
              "Refresh" 
            )
          )
        ),
      )
		);
  }
});


uiSelectManifestAndGuide = MkUiComponent(function uiSelectManifestAndGuide(my,props) { //U: ara elegir manifiesto y guia de embarque
 
  function onManifestSelected(e,{value}) { //U: cuando cambia el dropdown de manifiestos
		ManifiestoElegido = Manifiestos[value];
		console.log("ManifestSelected",value, ManifiestoElegido);
		my.setState({}); //A: trigger update
  }

  function onGuideSelected(e,{value}) { //U: cuando cambia el dropdown de guias
		GuiaElegida= ManifiestoElegido.guides[value];
		console.log("GuideSelected",value, GuiaElegida);
    guiaID = GuiaElegida.id; //U: global variable for select placeholder

    my.setState({}); //A: disparo actualizacion UI
    props.cambiarGuiaElegida(guiaID,true);
  }

  my.render= function (props, state) {
		var manifestOpts = Manifiestos.map( (manifiesto, idx) => {return {
					text: manifiesto.id || 'idNotFound',
					value: idx,
		}	});

		var awbOpts; 
		if (ManifiestoElegido) {
			manifiestoID = ManifiestoElegido.id; //A: actualizo placeholder select
			awbOpts = ManifiestoElegido.guides.map( (guia, guiaIdx) =>{
				return{
					text:  guia.id || 'AWB@' + guiaIdx+ ' has no id',
					value:  guiaIdx,
				}
			});
		}


    return (
      h('div',{},
        h(Segment, {raised:true,},
          h(Form,{},
            h(Form.Group,{}, 
              h(Form.Field, {inline: true},
                h(Label,{},`Manifest:`),
                h(Select,{ options: manifestOpts, placeholder: manifiestoID || 'not selected' , onChange: onManifestSelected}),
              ),
              awbOpts || my.props.guia  
                ? h(Form.Field, {inline: true},
                  h(Label,{},`Air waybill:`),
                  h(Select,{ options: awbOpts, placeholder: guiaID  || 'not selected', onChange : (e,{value}) => onGuideSelected(e,{value})}),
                )
              	: null
            )
          )
        ),
      )
		)
  }
});

uiGallery = MkUiComponent (function uiGallery(my){ //U: muestra los archivos de ArchivosInspeccionElegida

  function createLink(fileName){
    my.setState({url: `${MissionUrl}/${fileName}?tk=${genToken()}`}); //A: la url incluye el token de autorizacion
    minHeight = '25em';
  }

  //TODO: asegurar que le pasamos el token a todos los que necesitan imagenes videos etc.
  my.render = function(){
    return (
      h(Grid,{ stackable: true,divided: true,},
        h(Grid.Row,{},
          h(Grid.Column,{width: '4', style:{}},
            ArchivosInspeccionElegida.map( fileName => (
              fileName.substring(fileName.length-3) == 'mp4'
              ? h(Image,{onClick:()=> createLink(fileName), rounded: true,size: 'tiny',centered: true, src: VIDEO_ICON_URL, style:{'margin-top': '5%','cursor': 'pointer'}})
              : h(Image,{onClick:()=> createLink(fileName), rounded: true,size: 'small',centered: true, bordered: true, src: `${MissionUrl}/${fileName}`,style:{'margin-top': '5%','cursor': 'pointer'}})
              )
            )
          ),
          h(Grid.Column,{width: '12',style:{}},
            my.state.url
            ? my.state.url.search("mp4") != -1 
                ?h('iframe',{src: my.state.url,autoplay: false,style: {'min-height': minHeight,'min-width': '70%',border: 'none','display':'block',margin: '0 auto'}},)
                :h(Image,{centered: true, bordered: true, src: my.state.url})
            :null
          )
        )
      )
    )
  }
});

uiDetailMedia= MkUiComponent (function uiDetailMedia(my){ //U: componente que muestra un modal y llama a uiGaleria
  var modal= {
    'position': 'fixed', /* Stay in place */
    'z-index': '1', /* Sit on top */
    'padding-top': '50px', /* Location of the box */
    'left': '0',
    'top': '0',
    'width': '100%', /* Full width */
    'height': '100%', /* Full height */
    'overflow': 'auto', /* Enable scroll if needed */
    'background-color': 'rgb(0,0,0)', /* Fallback color */
    'background-color': 'rgba(0,0,0,0.4)', /* Black w/ opacity */
  }

  var modalContent= {
    'background-color':'#fefefe',
    'margin':' auto',
    'padding': '20px',
    'border': '1px solid #888',
    'width': '90%',
    'min-height': '25%'
  }

  my.state = { visible: true } //U: quiero que se muestre visible apenas aparezca
  function handleClick () { my.setState({visible: false}) }
  window.onclick = function(event) { //A: When the user clicks anywhere outside of the modal, close it
    if (event.target.id == 'myModal') { my.setState({visible: false}) }
  }

  my.render = function(){
    return (
      my.state.visible ? 
      h('div',{id:"myModal",class: 'modal',style:modal},
        h('div',{class: "modal-content",style:modalContent},
          h('div',{style:{}},
            h(Button,{icon: 'x', floated:'right',id: 'exit',onClick: handleClick}, ),
          ),
          h(Header,{as: 'h1'},
            h(Icon,{name: 'film'}),
            h(Header.Content,{},'Media for this item')
          ),
          h(uiGallery,{}) //A: dentro del modal muestro uiGallery
        )
      )
      : null
    )
  }
});

function mostrarError(){  //U: muestra mensaje por consola indicando el error y una solucion
	console.log({
		error: 'all air way bill fields must have a "history" field, and must be an ARRAY',
		historyExample: [{
							"nombre": "Inspection 1",
							"lugar": "CDMX Airport",
							"startTime": "2012-04-23T18:25:43.511Z",
							"endTime" : "2012-04-23T18:27:56.123Z"
						},
						{
							"nombre": "Inspection 2",
							"estado": "completado/incompleto",
							"startTime": "2012-04-23T18:25:43.511Z",
							"endTime" : "2012-04-23T18:27:56.123Z",
							"lugar": "CDMX Airport"  
						}]
	})
	return h('h1',{style: {color: 'white'}},'error, press f12 to more details');
}

uiTablaDetalle= MkUiComponent(function uiTablaDetalle(my) { //U: tabla que muestra el estado de UN item
  //U: props.guia una guia de embarque , props.evento (confronta, confronta2, previa) 
  var columnas = 6;
  if(my.props.evento == I3UNITS) columnas = 8;

  function tableRowClick(k) {
    revision=k.history; //A: recibo todo el array de history 
    for (let index = 0; index < revision.length; index++) {
      if ((revision[index].type == my.props.evento) && my.props.evento != "Pre Inspection"){  //pre inspection no puede tener files
        if (revision[index].files && revision[index].files.length > 0){
          ArchivosInspeccionElegida = revision[index].files;  //A: guardo en la variable la lista de files que quiero mostrar
          my.setState({mostrarModal: true});          //A: y muestro el modal
        }
      }    
    }
  }

  my.render= function (props, state) {
		var colTitles= ['Item Name','Reported','Inspected', 'Damaged', 'Missing', 'In Excess']; 
		if (my.props.evento == I2STORAGE) { 
			colTitles.push('Hall'); colTitles.push('Shelf');
		}
   	colTitles.push('Media'); 

    return (
      h('div',{id: 'uiTablaDetalle', style:{'overflow': 'auto', 'overflow-y': 'hidden'}},
        h(Table,{celled: true, striped: true,unstackable: true,selectable: true},

          h(Table.Header,{},
            h(Table.Row,{},
              h(Table.HeaderCell,{colSpan: columnas},
	              h(Icon,{name: 'file outline'}), `Event: ${my.props.evento}`,  )
            ),
            h(Table.Row,{},
              colTitles.map( t => h(Table.HeaderCell,{},t)),
            )
          ),

          h(Table.Body,{},
            my.props.guia.items.map( k => 
              k.history.map( revision =>              
                revision.type == my.props.evento ? //A: es la InspeccionElegida

									h(Table.Row,{onClick: ()=> { tableRowClick(k) },style:{cursor: 'pointer'}},
										h(Table.Cell, {collapsing: true}, k.name),

										'packages inspected damaged missing inExcess'.split(' ').map(k =>
											h(Table.Cell,{collapsing: true,textAlign:'right'}, revision[k] ||'-') 
										),
										
										revision.hall ? h(Table.Cell,{collapsing: true,textAlign:'right'}, `${revision.hall}`) : (my.props.evento == I2STORAGE ? h(Table.Cell,{collapsing: true,textAlign:'right'}, '-') : null),
										revision.shelf ? h(Table.Cell,{collapsing: true,textAlign:'right'}, `${revision.shelf}`) : (my.props.evento == I2STORAGE ? h(Table.Cell,{collapsing: true,textAlign:'right'}, '-') : null),
										//A: si existe el hall o shelf lo muestro, sino existe y evento != inspection2 no muestro nada(no me genera columna) , sino muestro '-'

										revision.files && revision.files.length>0 ? //A: tiene files
											h(Table.Cell,{collapsing: true,textAlign:'center'},
													h(Icon,{color:'green', name:'checkmark', size:'large'})
											)
											: h(Table.Cell,{collapsing: true,textAlign:'center'}, `-`)
									)
                  : null  
              ),
            )  
          )
        ),
        
        my.state.mostrarModal ? h(uiDetailMedia) : null //A: Modal para ver los files
      )           
		)
  }
});

uiPreInspectionCard= ({guia, onEventMoreInfo}) =>  //U: tarjeta de preinspeccion, mostramos siempre
	h(Segment,{clearing:true,style:{'max-height': '152px'}}, // Pre inspection Card, siempre!
		h('p',{style:{fontSize: '15px'}},
			h('b',{style:{'font-size':'20px'}},'Event: To be Inspected'),
			h('div',{},
				h('b',{style:{'margin-top': '5px'}},' Origin Airport:'), guia.OriginAirport || 'NA' ,
				h('b',{style:{'margin-top': '5px'}},' Destination Airport:'), guia.DestinationAirport || 'NA',
			)
		), 
		h(Grid,{columns: 'two', style: {}},
			h(Grid.Row,{},
				h(Grid.Column,{}, //primer columna  
					h('p',{style:{fontSize: '13px',}},
						h('div',{},h('b',{style:{color: COLORS.azulOscuro}},'Items: '), guia.items.length), 
					),
				),
				h(Grid.Column,{}, //otra columna
					h(Button,{
							floated:'right',
							onClick: () => {
								onEventMoreInfo('Pre Inspection',true);
								console.log('CLICK Pre Inspection More Info seleccionarEvento');
								setTimeout(() => {
									var el= document.getElementById("uiTablaDetalle")	
									el.scrollIntoView(); //A: movi para que se vea la tabla detalle
								}, 500);
							}
						},
						h('b',{},'More info')
					)
				)
			)
		)
	);


uiEventCard= (k,index, onEventMoreInfo) => {
	return	k.type != PALLETINSPECTION || (k.type == PALLETINSPECTION && k.problem == true) 
		? h(Segment,{clearing:true,style:{'max-height': '152px'}},
				h('p',{style:{fontSize: '15px'}},
					h('b',{style:{'font-size':'20px'}},'Event: ',k.type),
					h('div',{}, h('b',{style:{'margin-top': '5px'}},' Place:'), k.lugar)
				), 

				h(Grid,{columns: 'two', style: {}},
					h(Grid.Row,{},
						h(Grid.Column,{}, //primer columna  
							h('p',{style:{fontSize: '13px',}},

								h('div',{},h('b',{style:{color: COLORS.azulOscuro}},'Date: '),
									k.startTime ? JSONtoDATE(k.startTime) : '-'), 

								h('div',{},h('b',{style:{color: COLORS.azulOscuro}},' Start time: '),
									k.startTime ? JSONtoHour(k.startTime) : '-'),

								h('div',{},h('b',{style:{color: COLORS.azulOscuro}},' End time: '),
									k.endTime ? JSONtoHour(k.endTime) : '-'),

							),
						),

						h(Grid.Column,{}, //otra columna
							h(Button,
								{ floated:'right', 
									onClick: () => {
										onEventMoreInfo(k.type,k.files)
										console.log('CLICK More Info onEventMoreInfo');
										setTimeout(() => {
											var el= document.getElementById("uiTablaDetalle")	
											el.scrollIntoView(); //A: movi para que se vea la tabla detalle
										}, 500);
									}
								},
								h('b',{},'More info'))
						)
					)
				)
			)
		: null;
}

uiHistoryForActiveGuide= MkUiComponent(function uiHistoryForActiveGuide(my) { //U: parte izquierda del grid muestra el estado de la guia

  function onEventMoreInfo(tipoEvento,files) {  //U: muestro modal si el pallet esta daniado sino muestro tabla
		console.log("onEventMoreInfo",tipoEvento,files)
    if (tipoEvento == PALLETINSPECTION || tipoEvento == UNREGISTERED_ITEMS) {
      ArchivosInspeccionElegida = files;
      my.setState({wantsDetailForPalletEvent: true})
    }else{
      my.props.seleccionarEvento(tipoEvento,true)
    }
  }


  my.render= function (props, state) {
		return (
			h('div', {id:'app'},

			my.state.wantsDetailForPalletEvent ?  h(uiDetailMedia,{},'') : null ,

			GuiaElegida   
				? h('div',{},	
						h(uiPreInspectionCard,{guia: GuiaElegida, onEventMoreInfo}),

						Array.isArray(GuiaElegida.history)
						? GuiaElegida.history.map((guia, idx) => uiEventCard(guia, idx, onEventMoreInfo)) //A: para cada inspeccion registrada en la AWB
						: null
					)
				: mostrarError()
			)
		)
  }
});

uiClientPortal= MkUiComponent(function uiClientPortal(my) { //U: llama a los demas componentes que muestran el portal de guias
	var refreshManifest= async function () { //U: carga o vuelve a cargar los datos
		ManifiestoElegido= null;
    await obtenerManifiesto();//A: cuando se monta el componente cargo la informacion
		cambiarGuiaElegida(guiaID, true);
		my.setState({}); //A: actualizo, pero uso globales
  };

  my.componentWillMount = function () {
    document.body.style.backgroundColor = 'rgb(49, 84, 165)';
		//A: cambie el fondo de todo el documento
  }

  my.componentDidMount = refreshManifest();

  function cambiarGuiaElegida(guiaId,limpiar){  //U: con el id, se cambia la guia en el state
    if(limpiar){
      my.setState({archivo: null, history: null}),
      my.setState({evento: null})     
    }
    var guiaElegida = buscarGuia(guiaId);
    console.log("GuiaElegida", guiaElegida)
    my.setState({guiaElegida: guiaElegida})
  }

  function seleccionarEvento(evento, limpiar){ //TODO: usar el path en los datos, puede haber mas de uno del mismo tipo
    InspeccionElegida = evento; //U: que archivos quiero ver, archivos de confronta1, confrota2 o previa
    if (limpiar){ my.setState({archivo: null, history: null}) }
    my.setState({evento: evento})
  }

  my.render= function (props, state) { //U: aca se dibuja toda la pagina segun el estado
    return (
      h(Container, {},
        h(uiMenuTopbar,{onRefresh: refreshManifest}),

          ManifiestoError  
            ? h(Segment,{},'ERROR, ' + ManifiestoError)
            : h(uiSelectManifestAndGuide,{ //A: si esta cargado el manifiesto muestro los select para que seleccion la guia
								manifiestoID: ManifiestoElegido.id, 
								guia: my.state.guiaElegida, 
								cambiarGuiaElegida: cambiarGuiaElegida, 
						},)
          ,

          my.state.guiaElegida ? //A: tengo una guia elegida
          h('div',{id: "guiaElegida"}, //A: todo el detalle de la guia, cada inspeccion y si elijo una la tabla

            h(Header,{as:'h2', image:'./imagenes/palet.png', content:`Air Waybill: ${my.state.guiaElegida.id}`, style:{'color':'white','font-size':'23px','margin-top':'3%'}},),

						h(Grid,{ stackable: true,divided: true, style: {'margin-top': '3%'}}, //U: grid para dividir la pantalla en dos: inspecciones y detalle 
							h(Grid.Row,{},
								h(Grid.Column,{width: '7'},
									h(uiHistoryForActiveGuide,{GuiaDeEmbarque: GuiaElegida, seleccionarEvento: seleccionarEvento})            
								),
								h(Grid.Column,{width: '9'},
									my.state.evento 
										?  h(uiTablaDetalle,{guia: GuiaElegida, evento: my.state.evento})
										: null
								)
							)
						)
          )
          :
          null,
      )
		);
  }
});

//-----------------------------------------------------------------------------
//S: principal

Rutas= { //U; RUTA DE PREACT ROUTE
  "/":{cmp: uiLogin},
  "/menu": {cmp: uiClientPortal},
}

App= MkUiComponent(function App(my) {
 
  my.render= function (props, state) {
    return (
      h(Container, {id:'app'},
				h(preactRouter.Router, {history: History.createHashHistory()},
					Object.entries(Rutas).map( ([k,v]) => 
						h(v.cmp, {path: k, ...v}) //A: el componente para esta ruta
          ),
				), //A: la parte de la app que controla el router
				//VER: https://github.com/preactjs/preact-router
			)
		);
  }

});

//-----------------------------------------------------------------------------
//S: inicio
setTheme('chubby');
render(h(App), document.body);
//A: estemos en cordova o web, llama a la inicializacion
