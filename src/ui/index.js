function misiones_P() {
  return fetch('/api/mission').then(res => res.json())
}

function archivos_P(missionId){
  return fetch('/api/mission/' + missionId).then(res => res.json());
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
async function mostrarMasInfo (my, mision) {
  my.setState({wantsCfg: !my.state.wantsCfg});
  //archivos_P(mision.nombreCarpeta).then(res => console.log(res[0], res[1], res[2]));
  vectorDeNombres = await archivos_P(mision.nombreCarpeta);
  my.setState({nombreArchivos: vectorDeNombres});
  my.setState({nombreCarpeta: mision.nombreCarpeta});
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

//U: con el input del forma crea y envia un json con la iformacion de la mision
function crearMision(my) {
  var data = {
    "header": my.state.nombre,
    "description": my.state.descripcion,
    "meta": my.state.fechaExpiracion,
    "status":"sin iniciar",
    "nombreCarpeta": my.state.missionId
  }
  //TODO: sin funciona hacerlo funcion
  var url = "http://localhost:8080/api/mission/" + my.state.missionId;// url to the server side file that will receive the data.
  console.log(url);
  var index = new Blob([JSON.stringify(data)], { type: "application/octet-stream"});
  var formData = new FormData();
  formData.append("index",index,"index.json");
  var request = new XMLHttpRequest();
  request.open("POST", url);
  request.send(formData)
  //--------------------------------------------------------------------------------------------
}
App= MkUiComponent(function App(my) {
  XAPP = my;//A:para debug accesible desde la consola
  my.onCfg = onCfg;
  my.colorMision = colorMision;
  //my.crearMision = crearMision;
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
            h(Button,{onClick: () => mostrarMasInfo(my, estaMision)},'ver detalle')
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
        h('div', {id:'archivos', style: {display: state.wantsCfg ? 'block' : 'none' }},
        nombreArchivos ? 
					nombreArchivos.length>0 ?(
            h('div',{},
            h(Button,{onClick: () =>onCfg(my)},"volver"),
            nombreArchivos.map( nombreArchivo =>
              h('a',{href: `http://localhost:8080/api/mission/${nombreCarpeta}/${nombreArchivo}`, style: {"margin-left": "5%"}},nombreArchivo)
            )
            )
          )
            :
						h('div',{},'No hay ninguna archivo todavía')
					:
           h('div',{},'cargando')),
      
        //-----------------------------------------------------
        //FORMULARIO
        h('h2',{},'formulario de nueva mision'),
        h(Form,{},
          h(Form.Group, {widths: 'equal'},
            h(Form.Input,{onInput: e => { this.setState ({ nombre: e.target.value})}, value:my.state.nombre, fluid: true, label:'mission name', placeholder:'mission name'},),
            h(Form.Input,{onInput: e => { this.setState ({ missionId: e.target.value})}, value:my.state.missionId, fluid: true, label:'mission id', placeholder:'mission id'},),
            h(Form.Input,{onInput: e => { this.setState ({ fechaExpiracion: e.target.value})}, value:my.state.fechaExpiracion, fluid: true, label:'fecha expiracion', placeholder:'DD/MM/YYYY'},)
          ),
          h(Form.TextArea,{onInput: e => { this.setState ({ descripcion: e.target.value})}, value:my.state.descripcion,label: 'Mission Description'}),
          h(Form.Checkbox, {label:'extra mission option'}),
          h(Form.Button,{onClick: () => crearMision(my)},'Subir Mision')   
        ),
		));
  }
});

setTheme('chubby');  //cyborg
render(h(App), document.body);
//A: estemos en cordova o web, llama a la inicializacion


