function misiones_P() {
  return fetch('/api/mision').then(res => res.json())
}


var Estilos= "cerulean chubby cosmo cyborg darkly flatly journal lumen paper readable sandstone simplex slate solar spacelab superhero united yeti"
              .split(' ');
var app_style= {};

function setTheme(t) {
  var st= document.getElementById("tema");
  st.href='/node_modules/semantic-ui-forest-themes/semantic.'+t+'.min.css';
}

//TODO: mezclar las respuestas al azar
//TODO: mezclar las preguntas con algun criterio que ayude a memorizar?
function onCfg(my) { //U: puedo definir funciones que se llamen desde otras aca adentro
  my.setState({wantsCfg: !my.state.wantsCfg}); //A: cuando llamo my.setState se vuelve a dibujar el componente con render
  //A: como puse !my.state.wantsCfg si era false la cambia a true, si era true la cambia a false
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
    if (state.misiones){
      state.misiones.map(estaMision => { estaMision.extra= h('div',{},
        h(Icon,{name: 'sign language', color: 'green'}),
        h(Button,{},'ver detalle')
      ) }); 
    }
  
    //U: esta funcion dibuja la pantalla, podes usar elementos de html (ej. 'div') o Semantic UI (ej. Button)
    //el formato es h(elemento, propiedades, contenido1, contenido2, ...)
    return (
			h('div', {id:'app'},
        h(Button,{onClick: () => onCfg(my), style: {float: 'right'}, basic: true, color: 'gray'},'Cfg'),
				h('div',{style: {display: state.wantsCfg ? 'block' : 'none'}},
          //A: esta div se muestra solo si el my.state.wantsCfg es true
					h(Input,{ref: (e) => (my.nombre_el=e), value: my.nombre, placeholder: 'Tu nombre'}),
          h('div',{},
             Estilos.map(k => 
                h(Button,{basic: true, onClick: () => setTheme(k)},k))
          )
				),
        
        my.state.misiones ? 
         h(Item.Group, {items: my.state.misiones},) :
         h('div',{},'cargando')
		));
  }
});

setTheme('readable');
render(h(App), document.body);
//A: estemos en cordova o web, llama a la inicializacion


