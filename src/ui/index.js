function misiones_P() {
  return fetch('/api/mission').then(res => res.json())
}

var Estilos= "cerulean chubby cosmo cyborg darkly flatly journal lumen paper readable sandstone simplex slate solar spacelab superhero united yeti"
              .split(' ');
var app_style= {};

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

//U: componente que la primer pagina y que muestra las misiones Activas
uiMissions= MkUiComponent(function uiMissions(my) {
  XAPP = my;//A:para debug accesible desde la consola
  my.onCfg = onCfg;
  
  my.colorMision = colorMision;
  my.state.missionUploadOk = true;
  
  //VER: https://preactjs.com/guide/api-reference
  my.componentDidMount = function () {
    misiones_P().then( res => my.setState({misiones: res}));
    //A: la primera vez que se dibuja, busco las misiones y las guardo en mi state, se redibuja
  }
  
  my.render= function (props, state) {
    var misionesItems;
    var nombreCarpeta = state.nombreCarpeta;
    var nombreArchivos = state.nombreArchivos;
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
            h(Button,{onClick: () =>preactRouter.route("missions/" + estaMision.missionId)},'ver detalle')
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

//U: componente que muestra los archivos de una mision
uiMissionFiles = MkUiComponent( function uiMissionFiles(my) {
  
  my.componentWillMount = function () {
    fetch('/api/mission/' + this.props.missionId)
      .then(function(res) {
        return res.json();
      })
      .then(function(myJson) {
        my.setState({nombreArchivos: myJson})
      });
  }
  my.render = function(props,state){
    return(
        //U: mostrar lista de los archivos de una mision
        h('div', {id:'archivos',},
        state.nombreArchivos ? 
					state.nombreArchivos.length>0 ?(
            h('div',{},
              h(Button,{onClick: () =>onCfg(my)},"volver"),
              state.nombreArchivos.map( nombreArchivo =>
                h('a',{href: `http://localhost:8080/api/mission/${this.props.missionId}/${nombreArchivo}`, style: {"margin-left": "5%"}},nombreArchivo)
              )
            )
          )
            :
						h('div',{},'No hay ninguna archivo todavía')
					:
           h('div',{},'cargando'))   
        //-----------------------------------------------------
    )}
});


//U: las rutas que contiene mi web app
Rutas= {
	"/": {cmp: uiMissions},
  "/missions/:missionId": {cmp: uiMissionFiles},
}

app_style= { //U: CSS especifico para la aplicacion
	// 'background-color': '#cccccc',
	'height': '100%', /* You must set a specified height */
};


App= MkUiComponent(function App(my) {
  my.render= function (props, state) {
    return (
			h('div', {id:'app', style: app_style},
				//h(uiCfg), //A: ofrezco un boton de config para cambiar el tema

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


