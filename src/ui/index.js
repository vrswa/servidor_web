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
function mostrarMasInfo (mision) {
  console.log("te saludo desde la mision: ", mision);
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
App= MkUiComponent(function App(my) {
  XAPP = my;//A:para debug accesible desde la consola
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
            h('p',null,estaMision.status),
            h(Icon,{name: 'sign language', color: colorMision(estaMision.status)}),//TODO cambiar segun status
            h(Button,{onClick: () => mostrarMasInfo(estaMision)},'ver detalle')
          ),
        }
      }); 
    }
    //A: converir de expediente a lo que necesita semantic ui

    //U: esta funcion dibuja la pantalla, podes usar elementos de html (ej. 'div') o Semantic UI (ej. Button)
    //el formato es h(elemento, propiedades, contenido1, contenido2, ...)
    return (
      h(Container,{},
        h('div', {id:'app'},
        misionesItems ? 
					misionesItems.length>0 ?
         		h(Item.Group, {items: misionesItems,},) 
            :
						h('div',{},'No hay ninguna misión todavía')
					:
        	 h('div',{},'cargando'))
		));
  }
});

setTheme('chubby');  //cyborg
render(h(App), document.body);
//A: estemos en cordova o web, llama a la inicializacion


