function misiones_P() {
  return fetch('/api/missions').then(res => res.json())
}
function protocols_P() {
  return fetch('/api/protocols').then(res => res.json())
}

//Funciones
function setTheme(t) {
  var st= document.getElementById("tema");
  st.href='/node_modules/semantic-ui-forest-themes/semantic.'+t+'.min.css';
}
function onCfg(my) { //U: puedo definir funciones que se llamen desde otras aca adentro
  my.setState({wantsCfg: !my.state.wantsCfg}); //A: cuando llamo my.setState se vuelve a dibujar el componente con render
  //A: como puse !my.state.wantsCfg si era false la cambia a true, si era true la cambia a false
}

//U: pone el color para tres estados posibles "sin iniciar, iniciado, completado"
function colorMision( status){
  if (status === 'sin iniciar')
    return 'red';
  else if (status === 'iniciado'){
    return 'yellow'
  }
  return 'green';
}

//U: con el input del form crea y envia un json con la informacion de la mision
function crearMision(my) {
  //my.setState({missionUploadOk: !my.state.missionUploadOk}); //A: formulario animacion cargando
  var data = {
    "header": my.state.nombre,
    "description": my.state.descripcion ||  "sin descripcion",
    "meta": my.state.fechaExpiracion || "sin fecha caducidad",
    "status":"sin iniciar",
    "protocolId": my.state.missionId
  }
  //TODO: sin funciona hacerlo funcion
  //'/api/protocols/:protocolsId'
  var url = "http://localhost:8080/api/protocols/" + my.state.missionId;// url to the server side file that will receive the data.
  var index = new Blob([JSON.stringify(data)], { type: "application/octet-stream"});
  var formData = new FormData();
  //archivos
  var archivos = document.getElementById("files");
  console.log(archivos.files);
  for (var i = 0; i < archivos.files.length; i++) {
    formData.append(`file${i}`,archivos.files[i],archivos.files[i].name);
  }
  formData.append("index",index,"index.json");
  var request = new XMLHttpRequest();
  request.onreadystatechange = function() {
    if (request.readyState == XMLHttpRequest.DONE) {
        if(request.responseText == 'ok'|| 'OK'){
          my.setState({missionUploadOk: !my.state.missionUploadOk}); //A: activar cartel envio ok
          setTimeout(function(){ my.setState({missionUploadOk: !my.state.missionUploadOk}); console.log("asd")}, 4000) //A:despues de 4 segundos sacar cartel
          console.log("ok ");
        }
    }
  }

  request.open("POST", url);
  request.send(formData)
  //--------------------------------------------------------------------------------------------
}
//---------------------------------------------------------------------
//U: componente que que muestra la misiones de un protocolo
uiMissions= MkUiComponent(function uiMissions(my) {
  XAPP = my;//A:para debug accesible desde la consola
  
  my.colorMision = colorMision;
  my.state.missionUploadOk = true;
  my.onCfg = onCfg;
  //VER: https://preactjs.com/guide/api-reference
  my.componentDidMount = function () {
    misiones_P().then( res => my.setState({misiones: res}));
    //A: la primera vez que se dibuja, busco las misiones y las guardo en mi state, se redibuja
  }
  
  my.render= function (props, state) {
    var misionesItems;
    if (state.misiones){
      /*
		{
		  childKey: 0,
		  image: '../mision/misionA/misionA3.jpg',
		  header: 'arreglar tablero X',
		  description: 'Description',
		  meta: 'Metadata',
		  status: 'terminado',
		},
    */
      misionesItems= state.misiones.map(estaMision => {
        return {
          header: estaMision.header,
          description: estaMision.description,
          meta: estaMision.meta,
          status: estaMision.status,
          extra: h('div',{},
            h(Icon,{name: 'sign language', color: colorMision(estaMision.status)}),//A: cambia segun status
            h(Button,{onClick: () =>preactRouter.route("missions/" +estaMision.protocolId + '/' + estaMision.missionId)},'ver detalle'),
            h(Label, {color:'blue'},
              "Protocolo: ",
              h(Label.Detail,{}, estaMision.protocolId)
            )
          ),
        }
      }); 
    }
    //A: converir de expediente a lo que necesita semantic ui

    //U: esta funcion dibuja la pantalla, podes usar elementos de html (ej. 'div') o Semantic UI (ej. Button)
    //el formato es h(elemento, propiedades, contenido1, contenido2, ...)
    return (
      h(Container,{},
        h('div', {id:'app', style: {display: state.wantsCfg ? 'none' : 'block' }},
        misionesItems ? 
					misionesItems.length>0 ?
         		h(Item.Group, {items: misionesItems,},) 
            :
						h('div',{},'No hay ninguna misión todavía')
					:
           h('div',{},'cargando')),
        //-----------------------------------------------------
		));
  }
});

//U: componente muestra los protocolos
uiProtocols= MkUiComponent(function uiProtocols(my) {
  XAPP = my;//A:para debug accesible desde la consola

  //VER: https://preactjs.com/guide/api-reference
  my.componentDidMount = function () {
    protocols_P().then( res => my.setState({misiones: res}));
    //A: la primera vez que se dibuja, busco las misiones y las guardo en mi state, se redibuja
  }
  
  my.render= function (props, state) {
    var misionesItems;
    if (state.misiones){
      // { CARD GROUP
      //   header: 'Project Report - April',
      //   description: 'Leverage agile frameworks to provide a robust synopsis for high level overviews.',
      //   meta: 'ROI: 30%',
      // },
      misionesItems= state.misiones.map(estaMision => {
        return {
          header: estaMision.header,
          description: estaMision.description,
          meta: estaMision.meta,
          //extra: 
        }
      }); 
    }
    //A: converir de expediente a lo que necesita semantic ui
    return (
      h(Container,{},
        h(Header,{as:'h2', icon: true},
          h(Icon, {name: 'settings'}),
          "protocolos disponibles",
          h(Header.Subheader,{ },"la lista de protocolos representa todos los protocolos disponibles y en existencia en nuestra base de datos")
        ),
        h('div', {id:'app', style: {display: state.wantsCfg ? 'none' : 'block' }},
        misionesItems ? 
					misionesItems.length>0 ?
         		h(Card.Group, {items: misionesItems,},) 
            :
						h('div',{},'No hay ninguna misión todavía')
					:
           h('div',{},'cargando')),
        //-----------------------------------------------------
		));
  }
});
//U: componente que muestra los archivos de una mision
uiMissionFiles = MkUiComponent( function uiMissionFiles(my) {
  
  my.componentWillMount = function () {
    ///api/protocols/:protocolId/missions/:missionId
    fetch('/api/protocols/' + this.props.protocolId + '/missions/' + this.props.missionId)
      .then(function(res) {
        return res.json();
      })
      .then(function(myJson) {
        my.setState({nombreArchivos: myJson})
      });
  }
  // <Header as='h2' icon>
  //   <Icon name='settings' />
  //   Account Settings
  //   <Header.Subheader>Manage your account settings and set e-mail preferences.</Header.Subheader>
  // </Header>
  my.render = function(props,state){
    return(
        //U: mostrar lista de los archivos de una mision
        h('div', {id:'archivos',},
        state.nombreArchivos ? 
					state.nombreArchivos.length>0 ?(
            h('div',{},
              h(Button,{onClick: () =>preactRouter.route("/missions")},"volver"),
              h('ul',{},
              state.nombreArchivos.map( nombreArchivo =>
                //'/api/protocols/:protocolId/missions/:missionId/:file'
                h('li',{},h('a',{href: `http://localhost:8080/api/protocols/${this.props.protocolId}/missions/${this.props.missionId}/${nombreArchivo}`, style: {"margin-left": "5%"}},nombreArchivo))
              ))
            )
          )
            :
						h('div',{},'No hay ninguna archivo todavía')
					:
           h('div',{},'cargando'))   
        //-----------------------------------------------------
    )}
});

//U: componente que muestra un formulario y crea un mision nueva (se pueden subir archivos)
uiCreateProtocol= MkUiComponent(function uiCreateProtocol(my) {
	my.render= function () {
    return h('div',{},
      h('h1',{},"Proximamanete formulario"),
      h(Form,{success: my.state.missionUploadOk},
        h(Form.Group, {widths: 'equal'},
          h(Form.Input,{onInput: e => { this.setState ({ nombre: e.target.value})},required:true, value:my.state.nombre, fluid: true, label:'mission name', placeholder:'mission name'},),
          h(Form.Input,{onInput: e => { this.setState ({ missionId: e.target.value})}, required:true,value:my.state.missionId, fluid: true, label:'mission id', placeholder:'mission id'},),
          h(Form.Input,{onInput: e => { this.setState ({ fechaExpiracion: e.target.value})},required:true, value:my.state.fechaExpiracion, fluid: true, label:'fecha expiracion', placeholder:'DD/MM/YYYY'},)
        ),
        h(Form.TextArea,{onInput: e => { this.setState ({ descripcion: e.target.value})}, value:my.state.descripcion,label: 'Mission Description'}),
        h(Form.Checkbox, {label:'extra mission option'}),
        //A: mensaje subida exitosa de mision
        h(Message , {success: true, header:"formulario completado",content: "todo ok subido al server" },),
        //Select images: <input type="file" name="img" multiple></input>
        h('input',{type:'file',id:'files',multiple:true},"Add files"),
        h(Form.Button,{color:'blue',disabled: !my.state.nombre || !my.state.missionId,onClick: () => crearMision(my)},'Subir Mision')   
      ),
      h(Segment,{basic:true},
			  h(Button,{onClick: ()=> preactRouter.route("/")},"Volver"))
		);
	}
});

//U:Componente que permite cambiar el theme de la pagina
uiCfg= MkUiComponent(function uiCfg(my) {
  var Estilos= "cerulean chubby cosmo cyborg darkly flatly journal lumen paper readable sandstone simplex slate solar spacelab superhero united yeti"
              .split(' '); 
	my.render= function () {
    return (
			h('div', {id:'app'},
				h(Button,{onClick: () => onCfg(my), style: {float: 'right'}, basic: true, color: 'gray'},'Cfg'),
				h('div',{style: {display: my.state.wantsCfg ? 'block' : 'none'}},
          //A: esta div se muestra solo si el my.state.wantsCfg es true
          h('div',{},
             Estilos.map(k => 
                h(Button,{basic: true, onClick: () => setTheme(k)},k))
          )
        ),
      )
    )
	}
});

//U: las rutas que contiene mi web app
Rutas= {
  "/":{cmp: uiProtocols},
	"/missions": {cmp: uiMissions},
  "/missions/:protocolId/:missionId": {cmp: uiMissionFiles},
  "/protocol/createProtocol": {cmp: uiCreateProtocol}
}

app_style= { //U: CSS especifico para la aplicacion
	// 'background-color': '#cccccc',
	'height': '100%', /* You must set a specified height */
};

uiMenu= MkUiComponent(function uiMenu(my) {
  handleItemClick = (e, { name }) => my.setState({ activeItem: name }) 
  my.state= {
    activeItem: 'review'
  }
  const items = [
    { key: 'protocolos',  name: 'protocolos',onClick: ()=> {handleItemClick; preactRouter.route("/")}},
    { key: 'misiones', name: 'misiones',onClick: ()=> {handleItemClick; preactRouter.route("/missions") }},
    { key: 'nuevoProtocolo',  name: 'Nueva protocolo', onClick: ()=> {handleItemClick; preactRouter.route("/protocol/createProtocol")} },  
  ]
    
	my.render= function () {
    return (
			//h(Container, {id:'app'},
				h(Menu,{items: items},)
      //)
    )
	}
});
// const MenuExampleProps = () => <Menu items={items} />

App= MkUiComponent(function App(my) {
  my.render= function (props, state) {
    return (
      h(Container, {id:'app', style: app_style},
        h(uiMenu,{},),
        h(uiCfg,{},),
				h(preactRouter.Router, {history: History.createHashHistory()},
					Object.entries(Rutas).map( ([k,v]) => 
						h(v.cmp, {path: k, ...v}) //A: el componente para esta ruta
					)
				), //A: la parte de la app que controla el router
				//VER: https://github.com/preactjs/preact-router
			)
		);
  }
});


setTheme('chubby');  //cyborg
render(h(App), document.body);
//A: estemos en cordova o web, llama a la inicializacion


