SERVERIP = 'http://192.168.1.196:8888';
var Estilos= "cerulean chubby cosmo cyborg darkly flatly journal lumen paper readable sandstone simplex slate solar spacelab superhero united yeti"
              .split(' ');
var usuarioFormularioIngreso = '';

function setTheme(t) {
  var st= document.getElementById("tema");
  st.href='/node_modules/semantic-ui-forest-themes/semantic.'+t+'.min.css';
}

//COMPONENTE DE LOGIN

//recibe la lista de archivos y el evento 
uiIframe = MkUiComponent (function uiIframe(my){
  var revisiones = my.props.revisiones;
  var evento = my.props.evento;
  var url;
  var archivos;
  
  for (let index = 0; index < revisiones.length; index++) {
    if(revisiones[index].nombre == evento){
      archivos = revisiones[index].archivos;
    }
  }

  function createLink(fileName){
    //http://192.168.1.196:8888/api/blk/protocols/revisarNivelesLiquidos/motor.jpg
    my.setState({url: `${SERVERIP}/api/blk/protocols/revisarNivelesLiquidos/${fileName}`});
  }

  my.render = function(){
    return (
      h('div',{style:{'margin-top': '3%', 'min-height': '20em'}},
        h('h1',{},'Archivos disponibles'),
        archivos.map( fileName => h(Button,{onClick: () => createLink(fileName)}, fileName) ),
        my.state.url ?
        h('div',{style:{'margin-top': '3%'}},
          h('iframe',{src: my.state.url,allowFullScreen: true,autoplay: false,style: {padding: '10','min-height': '50em', width: '100%',border: 'none',overflow: 'hidden'}},)  
        ):
        null
      )  
    )
  }
});

//formulario de ingreso 
uiLogin = MkUiComponent (function uiLogin(my){
  my.componentWillMount = function () {
    var body = document.getElementsByTagName('body')[0];
    body.style.backgroundColor = 'rgb(49, 84, 165)';
  }

  tecleando = (e, { name, value }) => my.setState({[name]: value});
  enviarFormulario = () => {
    usuarioFormularioIngreso = my.state.nombre;
    if(usuarioFormularioIngreso !='' && usuarioFormularioIngreso != null & usuarioFormularioIngreso != undefined){
      if(my.state.password !='' && my.state.password != null & my.state.password != undefined)
      preactRouter.route("/menu")
    }
  }

  my.render = function(){
    return (
      h(Grid,{textAlign:'center', style:{ height: '100vh' }, verticalAlign:'middle'},
        h(Grid.Column, {style: {maxWidth: 450}},
          h(Image,{src:'blk.png'},), 
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

//menu principal de la parte superior 
uiMenu= MkUiComponent(function uiMenu(my) {
  handleItemClick = (e, { name }) => {my.setState({ activeItem: name });} 
  my.state= {
    activeItem: 'itemA'
  }

  my.render= function (props, state) {
    return (
      h(Menu,{item:true,stackable:true},
        h(Menu.Menu,{position:'right'},
          h(Menu.Item,{},
            h(Label, {as:'a',color:'yellow' ,image: true, style:{'font-size': '13px'}},
              `Bienvenido ${usuarioFormularioIngreso ? usuarioFormularioIngreso : ''}`,
              
            )
          ),
          h(Menu.Item,{},
             h(Button, {negative:true,onClick: () =>preactRouter.route("/")},"salir" ),
          )
        ),
      )

		);
  }
});

//selects para elegir manifiesto y guia de embarque
uiSelects = MkUiComponent(function uiSelects(my,props) {
  console.log("hola desde selects");
  console.log(props.manifiesto)
  const options = props.manifiesto.map( guia => 
      { return {
        key: guia.nombre,
        text:  guia.nombre,
        value:  guia.nombre
      }
    }
  )
  //se ejecuta cuando se seleccion un item del select
  function seleccion(e,{value}){
    my.setState({...my.state,value: value});
    props.cambiarGuiaSeleccionada(value,true);
  }
  my.render= function (props, state) {
    return (
      h('div',{},
        h(Segment,{raised:true},
          h(Form,{},
            h(Form.Group,{}, 
              h(Form.Field, {inline: true},
                h(Label,{},`Manifiesto: ${props.minifiestoID}`),
                h(Select,{ options:options, placeholder:'Guia de embarque', onChange : (e,{value}) => seleccion(e,{value}), value: my.state.value}),
              )
            )
          )
        ),
      )
		)
  }
});

//parte izquierda del grid muestra el estado de la guia
uiGuiasDeEmbarque= MkUiComponent(function uiGuiasDeEmbarque(my) {
  my.render= function (props, state) {
    if (props.GuiaDeEmbarque ){
      my.state = {
        ...my.state,
        GuiaDeEmbarque: my.props.GuiaDeEmbarque
      }
    }
  return (
    h('div', {id:'app'},
    my.state.GuiaDeEmbarque ? 
      h('div',{},
      h(Header,{as:'h2', icon:'server', content:`Guia: ${my.state.GuiaDeEmbarque.nombre}`, style:{'color':'white'}},),
      my.state.GuiaDeEmbarque.inspeccion.map((k,index) => 
            h(Segment,{clearing:true},
              h('p',{style:{fontSize: '15px',}},
                h('b',{},'Contrato: '),
                my.state.GuiaDeEmbarque.Contrato , 
                h('b',{style:{'margin-left': '3%'}},' Evento: '),
                k.nombre,
                h('b',{style:{'margin-left': '3%'}},' lugar:'),
                k.lugar
              ),
              h('p',{style:{fontSize: '13px',}},
                h('b',{},'fecha Inicio: '),
                k.fechaInicio ? k.fechaInicio : '-', 
                h('b',{style:{'margin-left': '3%'}},' hora Inicio: '),
                k.horaInicio ? k.horaInicio : '-',
                h('b',{style:{'margin-left': '3%'}},' hora Finalizacion: '),
                k.horaFinalizacion ? k.horaFinalizacion : '-',
              ),
              h(Button,{floated:'right',onClick: () => my.props.seleccionarEvento(k.nombre,true)},'Ver Items')
            )
          )
        )
        :
        h('h1',{},'eliga una guia')
      )
    )
  }
});

//parte derecha muestra los items 
uiTabla= MkUiComponent(function uiTabla(my) { 
  //U: props.guia una guia de embarque , props.evento (confronta, confronta2, previa) 
  
  my.render= function (props, state) {
    return (
      h('div',{style:{'overflow': 'auto', 'overflow-y': 'hidden'}},
        h(Table,{celled: true, striped: true,unstackable: true,selectable: true},
          h(Table.Header,{},
            h(Table.Row,{},
              h(Table.HeaderCell,{colSpan:'4'},
              h(Icon,{name: 'file outline'}),
              `Evento: ${my.props.evento}`,  
              )
            )
          ),
          h(Table.Body,{},
            my.props.guia.Items.map( k => 
              //my.props.selecRevisiones
              //h(Table.Row,{onClick: ()=> my.props.cambiarArchivo("video.mp4"),style:{cursor: 'pointer'}},
              h(Table.Row,{onClick: ()=>  my.props.selecRevisiones(k.revisiones),style:{cursor: 'pointer'}},
                h(Table.Cell,{collapsing: true},
                  k.itemName
                ),
                k.revisiones.map( revision =>              
                  revision.nombre == my.props.evento ?
                    Object.entries(revision).map( ([k,v]) =>
                      v != my.props.evento && k != "archivos" ? 
                        h(Table.Cell,{collapsing: true,textAlign:'right'}, `${k}: ${v}`) //A: el componente para esta ruta
                      :
                      null
                    ) : 
                  null  
                )
              )
            )  
          )
        )
      )
		)
  }
});

//grid para dividir la pantalla en dos 
uiGridField = MkUiComponent(function uiClientPortal(my,props) {
  //GuiaDeEmbarque: my.state.guiaSeleccionada,cambiarArchivo: cambiarArchivo, seleccionarEvento: seleccionarEvento, evento: my.state.evento
  my.render= function (props, state) {  
    return (
      h(Grid,{ stackable: true,columns: 'two', divided: true, style: {'margin-top': '3%'}},
        h(Grid.Row,{},
          h(Grid.Column,{},
            h(uiGuiasDeEmbarque,{GuiaDeEmbarque: props.GuiaDeEmbarque, seleccionarEvento: my.props.seleccionarEvento})            
          ),
          h(Grid.Column,{},
            my.props.evento ?  
              h(uiTabla,{guia: my.props.GuiaDeEmbarque, evento: my.props.evento,cambiarArchivo: my.props.cambiarArchivo, selecRevisiones: my.props.selecRevisiones})
              : 
              h(Header,{},'Seleccione una guia')
          )
        )
      )
		)
  }
});

//llama a los demas componente que muestran el portal de guias
uiClientPortal= MkUiComponent(function uiClientPortal(my) { 
  console.log("usuario: ", usuarioFormularioIngreso)
  //U: funcion que obtiene los nombre de los dataset disponibles
  async function obtenerManifiesto (){     
    var res = await fetch(`${SERVERIP}/api/blk/dataset/ManifestExample1.json`);
    var json = await res.json();
    my.setState({manifiesto: json}); 
  }
  //cambio el fondo
  my.componentWillMount = function () {
    var body = document.getElementsByTagName('body')[0];
    body.style.backgroundColor = 'rgb(49, 84, 165)';
  }
  //caundo se monta el componente cargo la informacion
  my.componentDidMount = async function () {
    await obtenerManifiesto();
  }
  //buscar una guia dentro de un manifiesto
  function buscarGuia( guiaId){
    listaGuias = my.state.manifiesto.GuiasDeEmbarque;
    //tengo un array de json que tiene la informacion de las guias
    for (let index = 0; index < listaGuias.length; index++) {
        if( listaGuias[index].nombre == guiaId){
          return listaGuias[index]
        }
    }
  }
  //funciona cambia la guia
  function cambiarGuiaSeleccionada (guiaId,limpiar){
    if(limpiar){
      my.setState({archivo: null, revisiones: null}),
      my.setState({evento: null})     
    }
    var guiaSeleccionada = buscarGuia(guiaId);
    my.setState({guiaSeleccionada: guiaSeleccionada})
  }
  function cambiarArchivo (nombreArchivo){
    my.setState({
      ...my.state,
      archivo: nombreArchivo
    })
  }
  function seleccionarEvento(evento, limpiar){
    console.log(evento)
    if(limpiar){
      my.setState({archivo: null, revisiones: null})     
    }
    my.setState({evento: evento})
  }

  function selecRevisiones(revisiones){
    my.setState({revisiones: revisiones})
  }

  function usuario(nombreUsuario){
    my.setState({usuario: nombreUsuario})
  }
  my.render= function (props, state) {
    return (
      h(Container, {},
        h(uiMenu,{}),
          my.state.manifiesto ? 
            h(uiSelects,{manifiesto: my.state.manifiesto.GuiasDeEmbarque, cambiarGuiaSeleccionada : cambiarGuiaSeleccionada,minifiestoID: my.state.manifiesto.manifiestoId},)
            :
            h('p',{},'')
          ,
          my.state.guiaSeleccionada?
          h(uiGridField,{GuiaDeEmbarque: my.state.guiaSeleccionada,cambiarArchivo: cambiarArchivo, seleccionarEvento: seleccionarEvento, evento: my.state.evento,selecRevisiones: selecRevisiones})
          :
          null,
          my.state.revisiones ?
            h(uiIframe,{evento: my.state.evento, revisiones: my.state.revisiones})
          :
            null
      )
		);
  }
});



//-----------------------------------------------------------------------------

//RUTA DE PREACT ROUTE
Rutas= {
  "/":{cmp: uiLogin},
  "/menu": {cmp: uiClientPortal}
}
//-----------------------------------------------------------------------------
App= MkUiComponent(function App(my) {
 
  my.render= function (props, state) {
    return (
      h(Container, {id:'app'},
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
//-----------------------------------------------------------------------------


setTheme('chubby');
render(h(App), document.body);
//A: estemos en cordova o web, llama a la iniciali zacion
